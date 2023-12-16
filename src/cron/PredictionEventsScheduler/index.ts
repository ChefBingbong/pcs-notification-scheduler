import { ChainId } from "@pancakeswap/chains";
import { Address } from "viem";
import {
      getPredictionRoundsWinners,
      getPredictionUsersData,
} from "../../graph/predictions/getUserBetHistory";
import { GRAPH_API_PREDICTION_BNB, GRAPH_API_PREDICTION_CAKE } from "../../provider/constants";
import { redisClient } from "../../redis";

import { sendPushNotification } from "../../notification";
import { notificationBodies } from "../../notification/payloadBuiler";
import { BuilderNames } from "../../notification/types";
import { ONE_DAY } from "../../util/time";
import { AbstractScheduler } from "../AbstractScheduler";
import { MainrArgs } from "../types";

export class PredictionRoundResultScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      private predictionType: "CAKE" | "BNB";
      private GRAPH_API: string;

      constructor(
            jobId: string,
            schedule: string,
            supportedChains: ChainId[],
            predictionType: "CAKE" | "BNB",
      ) {
            super({ jobId, schedule, supportedChains });
            this.predictionType = predictionType;
            predictionType === "CAKE"
                  ? (this.GRAPH_API = GRAPH_API_PREDICTION_CAKE)
                  : (this.GRAPH_API = GRAPH_API_PREDICTION_BNB);
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ subscribers: users }) {
            try {
                  const latestRound = await getPredictionRoundsWinners(this.GRAPH_API);
                  if (
                        latestRound.bets.length > 0 &&
                        (await redisClient.getSingleData<boolean | null>(latestRound.id))
                  ) {
                        const formattedUsers = users.map((u) => u.toLowerCase());
                        const { winners, loosers } = await getPredictionUsersData(
                              this.GRAPH_API,
                              latestRound.id,
                              formattedUsers,
                        );

                        await this.buildAndSendNotification(winners, latestRound.id, "predictions1");
                        await this.buildAndSendNotification(loosers, latestRound.id, "predictions2");
                  }
                  this.job.stopCronJob();
                  this.schedule = await this.calculateNewCronSchedule(
                        Number(latestRound.startAt),
                        15,
                        5,
                  );
                  console.log(this.job.jobId, this.schedule);
                  this.executeCronTask({ chainId: ChainId.BSC, subscribers: users });
            } catch (error) {
                  this.buildErrorMessage(error, ChainId.BSC);
            }
      }

      private async buildAndSendNotification(
            users: Address[],
            roundId: string,
            outcome: "predictions2" | "predictions1",
      ) {
            if (users.length > 0) {
                  const notificationBody = notificationBodies[outcome](this.predictionType, roundId);

                  await sendPushNotification(
                        BuilderNames.predictionWinnerNotification,
                        [users, notificationBody, this.predictionType],
                        users,
                  );
                  this.job.log.info(`${this.job.jobId} sent to ${users.length} users`);
            }
      }
}

export class PredictionUserOnBoardScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains });
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ chainId: network, subscribers: users }) {
            try {
                  const keysToSet: string[] = [];
                  const usersToNotify: Address[] = [];

                  const userTimestampKeys = redisClient.getUserTimestampKeys(
                        network,
                        this.job.jobId,
                        users,
                  );
                  const existResults = await redisClient.existMultipleData({ keys: userTimestampKeys });

                  for (let i = 0; i < users.length; i++) {
                        if (existResults[i]) continue;
                        keysToSet.push(userTimestampKeys[i]);
                        usersToNotify.push(users[i]);
                  }

                  await this.buildAndSendNotification(usersToNotify, keysToSet);
            } catch (error) {
                  this.buildErrorMessage(error, ChainId.BSC);
            }
      }

      private async buildAndSendNotification(users: Address[], keysToSet: string[]) {
            if (users.length === 0) return;

            const modifiedArray = users.map((item) => `eip155:1:${item}`);
            const notificationBody = notificationBodies["predictions3"]();

            await sendPushNotification(
                  BuilderNames.predictionNotifyNotification,
                  [modifiedArray, notificationBody],
                  users,
            );
            await redisClient.setMultipleDataWithExpiration(
                  keysToSet,
                  "prediction notified",
                  ONE_DAY * 7,
            );
            this.job.log.info(`${this.job.jobId} sent to ${users.length} users`);
      }
}
