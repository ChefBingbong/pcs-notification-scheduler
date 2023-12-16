import { ChainId } from "@pancakeswap/chains";
import axios from "axios";
import BigNumber from "bignumber.js";
import { Address, formatUnits } from "viem";
import { chainlinkOracleABI } from "../../abi/chainLinkOracleABI";
import { getViemClient } from "../../provider/client";
import { CHAINLINK_ORACLE_ADDRESS, COINGECKO_V3_API } from "../../provider/constants";
import appConfig from "../../config/config";
import { redisClient } from "../../redis/index";
import { RedisClient } from "../../redis";
import { AppLogger } from "../../logging/logger";
import { fixPrefix, removePrefix } from "../../util/utils";
import { BaseSchedulerOptions } from "../types";
import { BaseScheduler } from "../BaseScheduler";
import { ArrayBatcher, arrayBatcher } from "../utils/ArrayBatcher";
import { JobExecutor } from "../utils/sequentialExecutor";

export class GlobalTaskScheduler extends AppLogger {
      protected job: BaseScheduler; // Replace 'any' with the actual type of your job
      protected schedule: string;
      protected redisClient: RedisClient;

      public static initialized: boolean = false;
      public static cakePrice: string;
      public static subscribers: string[];
      public static subscribersFormatted: Address[];
      public static SchedulerIds: string[] = [];

      constructor({ jobId, schedule }: BaseSchedulerOptions) {
            super();
            this.schedule = schedule;
            this.job = new BaseScheduler({ jobId, schedule, process, log: this.getLogger(jobId) });
      }

      public async init() {
            this.job.createSchedule(this.schedule, async () => {
                  await JobExecutor.addToQueue(`${this.job.jobId}-1`, async () => {
                        try {
                              this.job.log.info(`${this.job.jobId} started`);

                              await this.updateGlobalCronState();

                              this.job.log.info(`${this.job.jobId} finished \n`);
                        } catch (error) {
                              this.job.log.error(`Error in ${this.job.jobId}: ${error}`);
                        }
                  });
            });
      }

      public async updateGlobalCronState() {
            await this.getCakePriceFromOracle();

            const tokenPrices = await this.fetchMultipleTokenUSDPrice(["ethereum", "binancecoin"]);
            await redisClient.setSignleData("multiple-prices", tokenPrices);

            const subscribers = await this.getAllActiveSubscribers();
            const fixedSubs = fixPrefix(subscribers);
            const formattedubscribers = removePrefix(subscribers);

            await redisClient.setSignleData("subscribers", fixedSubs);
            await redisClient.setSignleData("subscribers_formatted", formattedubscribers);

            GlobalTaskScheduler.subscribers = fixedSubs;
            GlobalTaskScheduler.subscribersFormatted = formattedubscribers;
            console.log(formattedubscribers.length, "formatted subs");

            GlobalTaskScheduler.SchedulerIds.forEach((scheduleId) => {
                  if (ArrayBatcher.getBatcherInstance(`${scheduleId}-subscribers`)) {
                        arrayBatcher.updateOriginalGroup<Address>(
                              `${scheduleId}-subscribers`,
                              formattedubscribers,
                        );
                  }
            });

            if (!GlobalTaskScheduler.initialized) GlobalTaskScheduler.initialized = true;
      }

      public async fetchMultipleTokenUSDPrice(tokens: string[]): Promise<{ [token: string]: number }> {
            const idstr = tokens.join(",");
            const response = await axios.get(`${COINGECKO_V3_API}/price?ids=${idstr}&vs_currencies=usd`);
            const tokenPriceMap: { [token: string]: number } = {};
            tokens.forEach((token: string) => (tokenPriceMap[token] = response.data[token].usd));
            return tokenPriceMap;
      }

      public async getAllActiveSubscribers(): Promise<string[]> {
            try {
                  const subscriberResponse = await axios.get(
                        `https://notify.walletconnect.com/${appConfig.walletConnectApiKey}/subscribers`,
                        {
                              method: "GET",
                              headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${appConfig.walletConnectSecretKey}`,
                              },
                        },
                  );

                  const subscriberResult = await subscriberResponse.data;
                  return subscriberResult as any;
            } catch (error) {
                  console.error("fetch subscribers error", error);
                  return [];
            }
      }

      public async getCakePriceFromOracle() {
            try {
                  const data = await getViemClient({ chainId: ChainId.BSC }).readContract({
                        abi: chainlinkOracleABI,
                        address: CHAINLINK_ORACLE_ADDRESS,
                        functionName: "latestAnswer",
                  });
                  const cakePrice = Number(Number(formatUnits(data, 8)).toFixed(2));
                  GlobalTaskScheduler.cakePrice = new BigNumber(cakePrice).toString();
            } catch (error) {
                  console.error("viewUserInfoForLotteryId", error.message);
                  GlobalTaskScheduler.cakePrice = "0";
            }
      }

      public static updateSchedlersList(schedulerId: string) {
            if (!this.SchedulerIds.includes(schedulerId)) {
                  this.SchedulerIds.push(schedulerId);
            }
      }
}
