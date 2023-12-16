import appConfig from "../config/config";
import { ChainId } from "@pancakeswap/chains";
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
import { MainrArgs, SchedulerInterface, Schedulers } from "./types";

const nativeBalanceJobChains = [ChainId.ZKSYNC, ChainId.ARBITRUM_ONE, ChainId.ETHEREUM, ChainId.BSC];
const supportedFarmsJobChains = [
      ChainId.ETHEREUM,
      ChainId.ZKSYNC,
      ChainId.BSC,
      ChainId.ARBITRUM_ONE,
      ChainId.LINEA,
      ChainId.POLYGON_ZKEVM,
];

export const AllCronJobs: { [key in Schedulers]: SchedulerInterface<MainrArgs<any>> } = {
      LowBalanceCheckScheduler: new LowBalanceCheckScheduler(
            `balance-check-cronTask`,
            appConfig.nativeBalanceSchedule,
            nativeBalanceJobChains,
      ),
      TokenPriceCheckScheduler: new TokenPriceCheckScheduler(
            `token-price-check-cronTask`,
            appConfig.tokenPricesSchedule,
            nativeBalanceJobChains,
      ),
      FarmsAPRCheckScheduler: new FarmsAPRCheckScheduler(
            `farms-apr-cronTask`,
            appConfig.farmAprSchedule,
            supportedFarmsJobChains,
      ),
      LotteryUserOnBoardingScheduler: new LotteryUserOnBoardingScheduler(
            `lotteries-update-cron`,
            appConfig.lotteryuUpdateSchedule,
            [ChainId.BSC],
      ),
      LotteryRoundResultsScheduler: new LotteryRoundResultsScheduler(
            `lotteries-result-cron`,
            appConfig.lotteryResultSchedule,
            [ChainId.BSC],
      ),
      PredictionUserOnBoardScheduler: new PredictionUserOnBoardScheduler(
            `predictions-cron-notify`,
            appConfig.predictionUpdateSchedule,
            [ChainId.BSC],
      ),
      PredictionRoundResultSchedulerCake: new PredictionRoundResultScheduler(
            `predictions-cron-result-cake`,
            appConfig.predictionWinnerSchedule,
            [ChainId.BSC],
            "CAKE",
      ),
      PredictionRoundResultSchedulerBnb: new PredictionRoundResultScheduler(
            `predictions-cron-result-bnb`,
            appConfig.predictionWinnerSchedule,
            [ChainId.BSC],
            "BNB",
      ),
      UserLpPositionCheckScheduler: new UserLpPositionCheckScheduler(
            `user-positions-notify-cronTask`,
            appConfig.positionNotifySchedule,
            [ChainId.BSC, ChainId.ETHEREUM],
      ),
      WhiteListFarmsScheduler: new WhiteListFarmsScheduler(
            `whitelist-farms-cronTask`,
            appConfig.whitelistFarmsSchedule,
            [ChainId.BSC, ChainId.ETHEREUM],
      ),
};
