import { ChainId } from "@pancakeswap/chains";
import "dotenv/config";
import appConfig from "./config/config";
import { AllCronJobs } from "./cron";
import { GlobalTaskScheduler } from "./cron/GlobalTaskScheduler";
import { SchedulerInterface } from "./cron/types";
import { SupportedChain } from "./provider/chains";
import { RedisClient } from "./redis";

export class AppInitializer extends GlobalTaskScheduler {
      private process: NodeJS.Process;
      public static redisClient: RedisClient;

      constructor() {
            super({ jobId: `main-service`, schedule: appConfig.subscribersSchedule });
            this.process = process;
      }

      public initializeSchedulers(jobs: SchedulerInterface<any>[]): void {
            jobs.forEach((job) => {
                  Object.values(SupportedChain).forEach((chain) => {
                        job.init(chain as any);
                  });
            });
      }

      public restartSchedulers(jobs: SchedulerInterface<any>[]): void {
            this.setUpCronTasks(jobs, ChainId.BSC as any);
      }

      public async setUpGlobalSchedulers() {
            await this.updateGlobalCronState();
            await this.init();
      }

      public startService(jobs: SchedulerInterface<any>[]): void {
            if (!GlobalTaskScheduler.initialized) {
                  throw new Error(`Global variables not initialized`);
            }
            this.process.on("unhandledRejection", this.handleError);
            this.process.on("uncaughtException", this.handleError);
            this.process.on("SIGINT", this.handleExit);
            this.process.on("SIGTERM", this.handleExit);

            this.initializeSchedulers(jobs);
            this.job.log.info("Jobs started");
      }

      private handleExit = (): void => {
            this.job.log.info(`Stopping common-init closing server...`);
            this.process.exit(0);
      };

      private handleError = (err: Error): void => {
            this.job.log.error(`Unhandled error in common-init: ${err.message}`);
            this.process.exit(1);
      };

      private setUpCronTasks(jobs: SchedulerInterface<any>[], chainId: ChainId) {
            jobs.forEach((job) => {
                  job.init(chainId);
            });
      }
}

export const service = new AppInitializer();

function main() {
      service.setUpGlobalSchedulers().then(() => {
            service.startService(Object.values(AllCronJobs));
      });
}

main();
