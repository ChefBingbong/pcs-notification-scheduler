import { ChainId } from "@pancakeswap/chains";
import { Address, PublicClient } from "viem";
import { AppLogger } from "../../logging/logger";
import { getViemClient } from "../../provider/client";
import { formatedAdjustedDateOverflow } from "../../util/utils";
import { BaseScheduler } from "../BaseScheduler";
import { GlobalTaskScheduler } from "../GlobalTaskScheduler";
import { AbstractSchedulerOptions, MainrArgs, SchedulerInterface } from "../types";
import { ArrayBatcher, arrayBatcher } from "../utils/ArrayBatcher";
import { JobExecutor } from "../utils/sequentialExecutor";

export abstract class AbstractScheduler<K, T extends MainrArgs<K> = MainrArgs<K>>
      extends AppLogger
      implements SchedulerInterface<T>
{
      public job: BaseScheduler;
      public readonly supportedChains: ChainId[];
      public schedule: string;

      private readonly chainsBatchSize: number | undefined;
      private readonly subscribersBatchSize: number | undefined;

      constructor({
            jobId,
            schedule,
            supportedChains,
            chainsBatchSize,
            subscribersBatchSize,
      }: AbstractSchedulerOptions) {
            super();
            if (!GlobalTaskScheduler.SchedulerIds.includes(jobId)) {
                  this.schedule = schedule;
                  this.supportedChains = supportedChains;
                  this.chainsBatchSize = chainsBatchSize;
                  this.subscribersBatchSize = subscribersBatchSize;
                  this.job = new BaseScheduler({ jobId, schedule, process, log: this.getLogger(jobId) });
                  GlobalTaskScheduler.SchedulerIds.push(jobId);
            } else {
                  throw new Error(`Scheduler with this id already exists`);
            }
      }

      abstract mainFunction(args: T): Promise<void>;

      abstract init(chainId: ChainId): Promise<void>;

      public async executeCronTask(args: T) {
            const { chainId } = args;

            this.initializeBatcher<ChainId>("chains", this.chainsBatchSize);
            this.initializeBatcher<Address>("subscribers", this.subscribersBatchSize);

            if (!this.supportedChains.includes(chainId)) return;

            this.job.createSchedule(this.schedule, async () => {
                  const subscribers = arrayBatcher.getCurrentBatch<Address>(
                        `${this.job.jobId}-subscribers`,
                  );

                  const chains = arrayBatcher.getCurrentBatch<ChainId>(`${this.job.jobId}-chains`);
                  if (!chains.includes(chainId)) return;

                  try {
                        await JobExecutor.addToQueue(`${this.job.jobId}-${chainId}`, async () => {
                              this.job.log.info(`${this.job.jobId} for ${chainId} chain - started`);

                              console.log(subscribers.length);
                              await this.mainFunction({ ...args, subscribers });
                              this.getNextChainsBatch(chains, chainId);
                              this.getNextSubscribersBatch(chainId);

                              this.job.log.info(`${this.job.jobId} for ${chainId} chain - finished \n`);
                        });
                  } catch (error) {
                        this.job.log.error(`Error in ${this.job.jobId}for ${chainId} chain: ${error}`);
                  }
            });
      }

      public async calculateNewCronSchedule(
            endTime: number,
            secondsBuffer?: number,
            minutesBuffer?: number,
      ) {
            const roundEndTime = new Date(endTime * 1000);

            let hour = roundEndTime.getUTCHours();
            let minute = roundEndTime.getUTCMinutes() + minutesBuffer;
            let second = roundEndTime.getUTCSeconds() + secondsBuffer;

            const { newSecond, newMinute, newHour } = formatedAdjustedDateOverflow(second, minute, hour);
            return `${newSecond} ${newMinute} ${newHour} * * * *`;
      }

      public getClient(chainId: ChainId): PublicClient {
            const provider = getViemClient({ chainId });
            return provider;
      }

      public getSubscribersFormatted(): Address[] {
            const subscribers = GlobalTaskScheduler.subscribersFormatted;
            return subscribers;
      }

      public getSubscribers(): string[] {
            const subscribers = GlobalTaskScheduler.subscribers;
            return subscribers;
      }

      public buildErrorMessage(error: any, network: ChainId) {
            let message = error;
            if (error instanceof Error) message = error.message;
            this.job.log.error(`Error fetching ${network} Balances for ${this.job.jobId}: ${message}`);
      }

      private initializeBatcher<T>(id: "chains" | "subscribers", initialBatchSize?: number | undefined) {
            const instance = ArrayBatcher.getBatcherInstance<T>(`${this.job.jobId}-${id}`);
            if (!instance) {
                  const mainGroup =
                        id === "chains" ? this.supportedChains : this.getSubscribersFormatted();
                  arrayBatcher.initialize<T>(
                        `${this.job.jobId}-${id}`,
                        mainGroup as T[],
                        initialBatchSize ?? mainGroup.length,
                  );
            }
      }

      private getNextChainsBatch(chains: ChainId[], chainId: ChainId): void {
            if (chains[chains.length - 1] === chainId) {
                  arrayBatcher.getNextGroup(`${this.job.jobId}-chains`);
            }
      }

      private getNextSubscribersBatch(chainId: ChainId): void {
            if (this.supportedChains[this.supportedChains.length - 1] === chainId) {
                  arrayBatcher.getNextGroup(`${this.job.jobId}-subscribers`);
            }
      }
}
