import { ChainId } from "@pancakeswap/chains";
import { Address } from "viem";
import { farmV3ApiFetch, getCakeAprAndTVL } from "../../graph/farms/fetchV3Farms";
import { getFarmLpApr } from "../../graph/farms/getFarmLpApr";
import { FarmInfo, FarmStorage, FarmV3DataWithPrice, FarmsV3Response } from "../../model/farms";
import { notificationBodies } from "../../notification/payloadBuiler";
import { CHAIN_ID_TO_FORMATTED_NAME } from "../../provider/chains";
import { FARMS_V3_ENDPOINT } from "../../provider/constants";
import { redisClient } from "../../redis";
import fetchWithTimeout from "../../util/fetchWithTimeout";
import { arrayToString, calculatePercentageIncrease, capitalizeFirstLetter } from "../../util/utils";
import { AbstractScheduler } from "../AbstractScheduler";
import { MainrArgs } from "../types";
import { sendPushNotification } from "../../notification";
import { BuilderNames } from "../../notification/types";

export class FarmsAPRCheckScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains, chainsBatchSize: 2 });
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ chainId, subscribers: users }) {
            try {
                  const farms = await farmV3ApiFetch(chainId);
                  const farmInfo: FarmInfo = {
                        tvls: {},
                        farmIds: [],
                        farmSymbols: [],
                  };

                  await this.getCurrentFarmsTVLs(farms, farmInfo, chainId);
                  const { lpAprs } = await getFarmLpApr({
                        addresses: Object.keys(farmInfo.tvls),
                        chainId,
                  });

                  const farmsWithAPR = farms.farmsWithPrice
                        .map((farm) => {
                              farmInfo.farmIds.push(farm.pid);
                              const tvl = farmInfo.tvls[farm.lpAddress]!;
                              const { cakeApr } = getCakeAprAndTVL(farm, tvl, farms.cakePerSecond);

                              return tvl
                                    ? {
                                            farm,
                                            apr: cakeApr + lpAprs[farm.lpAddress.toLowerCase()],
                                      }
                                    : null;
                        })
                        .filter((farm) => farm !== null);

                  const { cachedAprs } = await this.getRedisFarmCache(farmInfo.farmIds, chainId);
                  const farmsToUpdate: FarmStorage[] = [];

                  for (let farm = 0; farm < farmsWithAPR.length; farm++) {
                        const farmId = farmsWithAPR[farm].farm.pid;
                        const currentApr = farmsWithAPR[farm].apr;
                        const cachedApr = cachedAprs[farm] ?? 0;

                        if (currentApr === cachedApr || isNaN(currentApr)) continue;

                        const percentageDifference = calculatePercentageIncrease(cachedApr, currentApr);
                        console.log(percentageDifference);
                        if (percentageDifference >= 30 || cachedApr === 0) {
                              farmInfo.farmSymbols.push(farmsWithAPR[farm].farm.lpSymbol);
                              farmsToUpdate.push({ farmId, apr: currentApr, cachedApr });
                        }
                  }
                  await this.buildAndSendNotification(farmsToUpdate, farmInfo, chainId, users);
            } catch (error) {
                  this.buildErrorMessage(error, chainId);
            }
      }

      private async getCurrentFarmsTVLs(
            farms: FarmsV3Response<FarmV3DataWithPrice>,
            farmInfo: FarmInfo,
            chainId: ChainId,
      ) {
            const farmResults = await Promise.allSettled(
                  farms.farmsWithPrice.map((f) =>
                        fetchWithTimeout(`${FARMS_V3_ENDPOINT}/${chainId}/liquidity/${f.lpAddress}`)
                              .then((liquidity) => liquidity.json())
                              .catch((err) => {
                                    throw err;
                              }),
                  ),
            );
            farmResults.forEach((farmWithPrice, index: number) => {
                  farmInfo.tvls[farms.farmsWithPrice[index].lpAddress] =
                        farmWithPrice.status === "fulfilled"
                              ? {
                                      ...farmWithPrice.value.formatted,
                                      updatedAt: farmWithPrice.value.updatedAt,
                                }
                              : null;
            });
      }

      private getFarmNotificationBody(
            lpSymbols: string[],
            farmsToUpdate: FarmStorage[],
            chainId: ChainId,
      ) {
            const lpSymbolString = arrayToString(
                  lpSymbols.length >= 3 ? lpSymbols.slice(0, 3) : lpSymbols,
            );
            const network = CHAIN_ID_TO_FORMATTED_NAME[chainId];
            const currentApr = farmsToUpdate[0].apr;
            const cachedApr = farmsToUpdate[0].cachedApr;

            const notificationBody = notificationBodies["farms"](
                  lpSymbolString,
                  network,
                  currentApr.toString(),
                  cachedApr.toString(),
                  lpSymbols.length > 1,
            );

            return notificationBody;
      }

      private async getRedisFarmCache(farmIds: number[], chainId: ChainId) {
            const farmCacheKeys = redisClient.getFarmCacheKeys(farmIds, chainId);
            const cachedAprs = await redisClient.getMultipleData<number>({
                  keys: farmCacheKeys.aprKeys,
            });

            return { cachedAprs };
      }

      private async updateFarmRedisCache(farmsToUpdate: FarmStorage[], chainId: ChainId) {
            const farmIdsToUpdate = farmsToUpdate.map((f) => f.farmId);
            const farmAprsToUpdate = farmsToUpdate.map((f) => f.apr);

            const updatedFarmCacheKeys = redisClient.getFarmCacheKeys(farmIdsToUpdate, chainId);
            await redisClient.setMultipleData(updatedFarmCacheKeys.aprKeys, farmAprsToUpdate);
      }

      private async buildAndSendNotification(
            farmsToUpdate: FarmStorage[],
            farmInfo: FarmInfo,
            chainId: ChainId,
            users: Address[],
      ) {
            if (farmsToUpdate.length === 0) return;
            const notificationBody = this.getFarmNotificationBody(
                  farmInfo.farmSymbols,
                  farmsToUpdate,
                  chainId,
            );
            const chainName = capitalizeFirstLetter(CHAIN_ID_TO_FORMATTED_NAME[chainId]);

            await sendPushNotification(
                  BuilderNames.farmAprNotification,
                  [users, notificationBody, chainName],
                  users,
            );
            await this.updateFarmRedisCache(farmsToUpdate, chainId);
            this.job.log.info(`${this.job.jobId} sent to ${users.length} users`);
      }
}
