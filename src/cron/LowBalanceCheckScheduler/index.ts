import { ChainId } from "@pancakeswap/chains";
import { Address, formatUnits } from "viem";
import { multicallABI } from "../../abi/multicallABI";
import { MULTICALL3_ADDRESSES as MULTICALL } from "@pancakeswap/multicall";
import { redisClient } from "../../redis";
import { nativeToId } from "../../util/utils";
import { BuilderNames } from "../../notification/types";
import { sendPushNotification } from "../../notification";
import { notificationBodies } from "../../notification/payloadBuiler";
import { AbstractScheduler } from "../AbstractScheduler";
import { MainrArgs } from "../types";

export class LowBalanceCheckScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains });
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ chainId, subscribers: users }: MainrArgs<Address>) {
            try {
                  const networkName = nativeToId(chainId);
                  const tokenPrices = await redisClient.getSingleData<{
                        [token: string]: number;
                  }>("multiple-prices");
                  const marketPriceOfBalance = tokenPrices[networkName];
                  const existResults = await redisClient.existMultipleData({
                        keys: redisClient.getBalanceKeys(users, chainId),
                  });

                  const { userBalances } = await this.fetchUserBalances(users, chainId);
                  const { cachedBalance } = await this.getCachedUserBalances(users, chainId);

                  const usersToNotify: Address[] = [];
                  const newUserBalances: number[] = [];

                  for (let subscriberIndex = 0; subscriberIndex < users.length; subscriberIndex++) {
                        const currentBalance = userBalances[subscriberIndex];
                        const cachedUserBalance = cachedBalance[subscriberIndex];

                        if (currentBalance === cachedUserBalance || existResults[subscriberIndex]) {
                              continue;
                        }
                        const isBalanceBelowThreshold = marketPriceOfBalance * currentBalance < 15;

                        if (currentBalance !== cachedUserBalance && isBalanceBelowThreshold) {
                              console.log(currentBalance, users[subscriberIndex]);
                              newUserBalances.push(currentBalance);
                              usersToNotify.push(users[subscriberIndex]);
                        }
                  }
                  await this.buildAndSendNotification(usersToNotify, newUserBalances, chainId);
            } catch (error) {
                  this.buildErrorMessage(error, chainId);
            }
      }

      private async getCachedUserBalances(
            users: Address[],
            network: ChainId,
      ): Promise<{ cachedBalance: number[] }> {
            const balanceKeys = redisClient.getBalanceKeys(users, network);
            const cachedSubscriberBalance = await redisClient.getMultipleData<number>({
                  keys: balanceKeys,
                  notFoundValue: 0,
            });
            if (cachedSubscriberBalance) return { cachedBalance: cachedSubscriberBalance };
            return { cachedBalance: [] };
      }

      private async fetchUserBalances(users: Address[], chainId: ChainId) {
            const balanceCalls = users.map((user: Address) => this.balanceContractCalls(user, chainId));
            const aggregatedBalanceCalls = balanceCalls
                  .filter((balanceCall) => balanceCall[0] !== null)
                  .flat();

            const balanceMulticallResult = await this.getClient(chainId).multicall({
                  contracts: aggregatedBalanceCalls,
                  allowFailure: false,
            });

            return {
                  userBalances: balanceMulticallResult.map((balance: bigint) =>
                        Number(formatUnits(balance, 18)),
                  ),
            };
      }

      private async buildAndSendNotification(
            usersToNotify: Address[],
            newUserBalances: number[],
            network: ChainId,
      ) {
            if (usersToNotify.length === 0) return;
            const notificationBody = notificationBodies["balances"]();

            await sendPushNotification(
                  BuilderNames.lowBalanceNotification,
                  [usersToNotify, notificationBody, network],
                  usersToNotify,
            );

            await redisClient.setMultipleDataWithExpiration(
                  redisClient.getBalanceKeys(usersToNotify, network),
                  newUserBalances,
                  1000 * 60 * 60 * 6,
            );
            this.job.log.info(`${this.job.jobId} sent to ${usersToNotify.length} users`);
      }

      private balanceContractCalls(address: Address, chainId: ChainId) {
            return [
                  {
                        abi: multicallABI,
                        address: MULTICALL[chainId],
                        functionName: "getEthBalance",
                        args: [address],
                  },
            ] as const;
      }
}
