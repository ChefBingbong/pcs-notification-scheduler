import { ChainId } from "@pancakeswap/sdk";
import { Address, PublicClient } from "viem";
import { BaseScheduler } from "./BaseScheduler";
import { LowBalanceCheckScheduler } from "./LowBalanceCheckScheduler";
import { TokenPriceCheckScheduler } from "./TokenPriceCheckScheduler";
import { FarmsAPRCheckScheduler } from "./FarmsAPRCheckScheduler";
import { LotteryRoundResultsScheduler, LotteryUserOnBoardingScheduler } from "./LotteryEventsScheduler";
import {
      PredictionRoundResultScheduler,
      PredictionUserOnBoardScheduler,
} from "./PredictionEventsScheduler";
import { UserLpPositionCheckScheduler } from "./UserLpPositionCheckScheduler";
import { WhiteListFarmsScheduler } from "./WhiteListFarmsScheduler";

export interface SchedulerInterface<T> {
      job: BaseScheduler;
      supportedChains: ChainId[];
      mainFunction(args: T): Promise<void>;
      init(chainId: ChainId): Promise<void>;
      executeCronTask(args: T): Promise<void>;
      calculateNewCronSchedule(
            endTime: number,
            secondsBuffer?: number,
            minutesBuffer?: number,
      ): Promise<string>;
      getClient(chainId: ChainId): PublicClient;
      getSubscribers(): string[];
      getSubscribersFormatted(): Address[];
      buildErrorMessage(error: any, network: ChainId): void;
}

export type MainrArgs<T> = {
      chainId?: ChainId;
      subscribers?: T[];
};

export interface BaseSchedulerOptions {
      jobId: string;
      schedule: string;
}

export interface AbstractSchedulerOptions extends BaseSchedulerOptions {
      supportedChains: ChainId[];
      chainsBatchSize?: number | undefined;
      subscribersBatchSize?: number | undefined;
}

export enum Schedulers {
      LowBalanceCheckScheduler = "LowBalanceCheckScheduler",
      TokenPriceCheckScheduler = "TokenPriceCheckScheduler",
      FarmsAPRCheckScheduler = "FarmsAPRCheckScheduler",
      LotteryRoundResultsScheduler = "LotteryRoundResultsScheduler",
      LotteryUserOnBoardingScheduler = "LotteryUserOnBoardingScheduler",
      PredictionUserOnBoardScheduler = "PredictionUserOnBoardScheduler",
      PredictionRoundResultSchedulerCake = "PredictionRoundResultSchedulerCake",
      PredictionRoundResultSchedulerBnb = "PredictionRoundResultSchedulerBnb",
      UserLpPositionCheckScheduler = "UserLpPositionCheckScheduler",
      WhiteListFarmsScheduler = "WhiteListFarmsScheduler",
}

export type SchedulerKeys =
      | LowBalanceCheckScheduler
      | TokenPriceCheckScheduler
      | FarmsAPRCheckScheduler
      | LotteryRoundResultsScheduler
      | LotteryUserOnBoardingScheduler
      | PredictionRoundResultScheduler
      | PredictionUserOnBoardScheduler
      | UserLpPositionCheckScheduler
      | WhiteListFarmsScheduler;
