import { ChainId } from "@pancakeswap/chains";
import axios from "axios";
import { Address } from "viem";
import { poolV3Abi } from "../../abi/PoolV3Abi";
import { PANCAKESWAP_V3_API } from "../../provider/constants";
import { tickeRanges } from "../../model/userPositions";
import { redisClient } from "../../redis";
import { AbstractScheduler } from "../AbstractScheduler";
import { arrayBatcher } from "../utils/ArrayBatcher";
import { MainrArgs } from "../types";

export class WhiteListFarmsScheduler extends AbstractScheduler<
      Address,
      Omit<MainrArgs<Address>, "subscribers">
> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains });
            supportedChains.forEach((chain) =>
                  arrayBatcher.initialize<Address>(`${this.job.jobId}-${chain}`, ["0x"], 120),
            );
      }

      public async init(chainId: ChainId) {
            this.executeCronTask({ chainId });
      }

      async mainFunction({ chainId: networkId }): Promise<void> {
            try {
                  const response = await axios.get(`${PANCAKESWAP_V3_API}/${networkId}/farms`);
                  const body = JSON.parse(JSON.stringify(response.data));
                  const lpSymbolMap: { [pool: string]: string } = {};

                  const farms: Address[] = body.farmsWithPrice.map(
                        (farm: { lpAddress: Address; lpSymbol: string }) => {
                              lpSymbolMap[farm.lpAddress.toLowerCase()] = farm.lpSymbol;
                              return farm.lpAddress.toLowerCase();
                        },
                  );
                  await this.storePoolTickRanges(networkId, farms);
                  arrayBatcher.updateOriginalGroup<Address>(`${this.job.jobId}-${networkId}`, farms);

                  await redisClient.setSignleData(`lpsymbol-map-${networkId}`, lpSymbolMap);
                  await redisClient.setSignleData(`whitelistedFarms-${networkId}`, {
                        pools: farms,
                        lastUpdateTimestamp: new Date().getTime() / 1000,
                  });
            } catch (error) {
                  this.buildErrorMessage(error, networkId);
            }
      }

      private async getPoolTick(
            networkId: ChainId,
            poolAddresses: Address[],
      ): Promise<(number | null)[]> {
            const client = this.getClient(networkId);
            const responses = await client.multicall({
                  contracts: poolAddresses.map((poolAddress) => ({
                        address: poolAddress,
                        abi: poolV3Abi,
                        functionName: "slot0",
                  })),
            });

            return responses.map((response) =>
                  response.result ? (response.result.at(1) as number) : null,
            );
      }

      private async storePoolTickRanges(networkId: ChainId, farms: Address[]) {
            const ticks = await this.getPoolTick(networkId, farms);
            const batchPositionsTickRanges: tickeRanges = {
                  tickUpper: [],
                  tickLower: [],
            };
            farms.forEach((poolId, index) => {
                  if (ticks[index] !== null) {
                        batchPositionsTickRanges.tickLower.push({
                              poolId,
                              tick: ticks[index],
                              tickRangeOut: "tickLower",
                        });
                        batchPositionsTickRanges.tickUpper.push({
                              poolId,
                              tick: ticks[index],
                              tickRangeOut: "tickUpper",
                        });
                  }
            });
            await redisClient.setSignleData(`ticks-map-${networkId}`, batchPositionsTickRanges);
      }
}
