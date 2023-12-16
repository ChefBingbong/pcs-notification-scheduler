import { ChainId } from "@pancakeswap/chains";
import { Address } from "viem";
import { redisClient } from "../../redis";
import { nativeToId } from "../../util/utils";
import { BuilderNames } from "../../notification/types";
import { sendPushNotification } from "../../notification";
import { AbstractScheduler } from "../AbstractScheduler";
import { TWO_HOURS } from "../../util/time";
import { MainrArgs } from "../types";

export class TokenPriceCheckScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains });
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ chainId: network, subscribers: users }: MainrArgs<Address>) {
            try {
                  const tokenPrices = await redisClient.getSingleData<{
                        [token: string]: number;
                  }>("multiple-prices");
                  const token = nativeToId(network);
                  const currentPrice = tokenPrices[token];

                  let { shouldNotBeNotified, lastPrice } = await this.getPriceJobCachevalues(
                        token,
                        network,
                  );
                  const { percentageIncrease, absoluteChange, hasFallen } = this.isPriceIncrease(
                        lastPrice,
                        currentPrice,
                  );

                  if (absoluteChange < 2 || shouldNotBeNotified) return;

                  await sendPushNotification(
                        BuilderNames.tokenPriceMovementNotification,
                        [
                              users,
                              token,
                              hasFallen,
                              percentageIncrease,
                              currentPrice,
                              lastPrice,
                              hasFallen,
                              network,
                        ],
                        users,
                  );
                  await this.updatePriceJobRedisCache(token, currentPrice, network);
                  this.job.log.info(`${this.job.jobId} sent to ${users.length} users`);
            } catch (error) {
                  this.buildErrorMessage(error, network);
            }
      }

      private async updatePriceJobRedisCache(token: string, price: number, network: ChainId) {
            await redisClient.setSignleDataWithExpiration(
                  `${this.job.jobId}-${network}-${token}`,
                  "",
                  TWO_HOURS,
            );
            await redisClient.setSignleData(`latestPrice-${token}-${network}`, price.toString());
      }

      private async getPriceJobCachevalues(
            token: string,
            network: ChainId,
      ): Promise<{ shouldNotBeNotified: boolean; lastPrice: number | null }> {
            const shouldNotBeNotified = await redisClient.existSingleData(
                  `${this.job.jobId}-${network}-${token}`,
            );
            const lastPrice = await redisClient.getSingleData<number | null>(
                  `latestPrice-${token}-${network}`,
                  0,
            );
            return { shouldNotBeNotified, lastPrice };
      }

      private isPriceIncrease(lastPrice: number, currentPrice: number) {
            const priceDifference = currentPrice - lastPrice;
            const percentageIncrease = (priceDifference / Math.abs(lastPrice)) * 100;
            return {
                  percentageIncrease: percentageIncrease.toFixed(2),
                  absoluteChange: Math.abs(percentageIncrease),
                  hasFallen: Boolean(percentageIncrease > 0),
            };
      }
}
