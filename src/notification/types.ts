export enum NotificationBodyKeys {
      Lottery1 = "lottery1",
      Lottery2 = "lottery2",
      Lottery3 = "lottery3",
      Balances = "balances",
      Prices = "prices",
      Predictions1 = "predictions1",
      Predictions2 = "predictions2",
      Predictions3 = "predictions3",
      Farms = "farms",
      TradingReward1 = "tradingReward1",
      TradingReward2 = "tradingReward2",
      TradingReward3 = "tradingReward3",
      Liquidity1 = "liquidity1",
      Liquidity2 = "liquidity2",
}

export enum BuilderNames {
      LPOutOfRangeNotification = "LPOutOfRangeNotification",
      tokenPriceMovementNotification = "tokenPriceMovementNotification",
      lotteryNotification = "lotteryNotification",
      lowBalanceNotification = "lowBalanceNotification",
      predictionWinnerNotification = "predictionWinnerNotification",
      predictionNotifyNotification = "predictionNotifyNotification",
      predictionParticipationNotification = "predictionParticipationNotification",
      farmAprNotification = "farmAprNotification",
      tradingRewardNotification = "tradingRewardNotification",
}

export enum ScopeIdsToName {
      Lottery = "b42403b3-2712-4e1e-8cc7-cb2d9c1350b4",
      Prediction = "52816341-59cd-49e2-8f3b-d15bf2c107fb",
      Liquidity = "02879833-eb9c-4cc3-8760-f762ab218ca6",
      Farms = "cf41e730-22d8-42d6-a7d5-1e79b6f7820b",
      PriceUpdates = "ad885f1d-3f25-46ea-916a-7ebe630b6f98",
      Promotional = "87393202-5cd7-4a0b-a672-bd4eded25e7b",
      Alerts = "069d1195-50a0-47b0-81a6-2df3024831ba",
      TradingReward = "e0a3aeb3-3ec2-496d-b6c7-343185de6aca",
}

export type pushNotification = {
      title: string;
      body: string;
      icon: string;
      url: string;
      type: string;
};

export type NotificationPayload = {
      accounts: string[];
      notification: pushNotification;
};

export interface BodyTypes {}

export type NotificationBody = {
      [NotificationBodyKeys.Lottery1]: (
            timeRemaining: string,
            cakeAmount: string,
            cakeAmountUSD: string,
      ) => string;
      [NotificationBodyKeys.Lottery2]: (timeRemaining: string) => string;
      [NotificationBodyKeys.Lottery3]: (roundId: string) => string;
      [NotificationBodyKeys.Balances]: () => string;
      [NotificationBodyKeys.Prices]: (
            token: string,
            isUp: string,
            percentageChange: string,
            oldPrice: string,
            currentPrice: string,
      ) => string;
      [NotificationBodyKeys.Predictions1]: (asset: "CAKE" | "BNB", roundId: string) => string;
      [NotificationBodyKeys.Predictions2]: (asset: "CAKE" | "BNB", roundId: string) => string;
      [NotificationBodyKeys.Predictions3]: () => string;
      [NotificationBodyKeys.Farms]: (
            farms: string,
            chainId: string,
            currentApr: string,
            lastApr: string,
            isMultiple: boolean,
      ) => string;
      [NotificationBodyKeys.TradingReward1]: (reward: string, timeRemainingToClaim: string) => string;
      [NotificationBodyKeys.TradingReward2]: () => string;
      [NotificationBodyKeys.TradingReward3]: () => string;
      [NotificationBodyKeys.Liquidity1]: (chainId: string, lpSymbols: string) => string;
      [NotificationBodyKeys.Liquidity2]: (chainId: string, lpSymbol: string) => string;
};
export interface PancakeNotificationBuilders {
      ["LPOutOfRangeNotification"]: {
            LPOutOfRangeNotification: () => pushNotification;
      };
      ["tokenPriceMovementNotification"]: {
            tokenPriceMovementNotification: (
                  token1: string,
                  token2: string,
                  token1Amount: string,
                  token2Amount: string,
            ) => pushNotification;
      };
      ["lotteryNotification"]: { lotteryNotification: () => pushNotification };
      ["lowBalanceNotification"]: {
            lowBalanceNotification: (
                  accounts: string[],
                  body: string,
                  chainId: number,
            ) => pushNotification;
      };
      ["predictionWinnerNotification"]: {
            predictionWinnerNotification: (
                  accounts: string[],
                  body: string,
                  chainId: number,
            ) => pushNotification;
      };
      ["predictionParticipationNotification"]: {
            predictionParticipationNotification: (
                  accounts: string[],
                  body: string,
                  chainId: number,
            ) => pushNotification;
      };
      ["predictionNotifyNotification"]: {
            predictionNotifyNotification: (
                  accounts: string[],
                  body: string,
                  chainId: number,
            ) => pushNotification;
      };
      ["farmAprNotification"]: {
            farmAprNotification: (accounts: string[], body: string, chainId: number) => pushNotification;
      };
      ["tradingRewardNotification"]: {
            tradingRewardNotification: (
                  accounts: string[],
                  body: string,
                  chainId: number,
            ) => pushNotification;
      };
}
