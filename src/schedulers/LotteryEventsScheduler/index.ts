import { ChainId } from "@pancakeswap/chains";
import { Address, getAddress } from "viem";
import {
      getCurrentLotteryEntity,
      getLotteryInformation,
} from "../../graph/lotteryPositions/getUpComingLotteryData";
import {
      fetchUserTicketsForOneRound,
      getLotteryPrizeInCake,
} from "../../graph/lotteryPositions/getUserTicketInfo";
import { UserFlattenedRoundData } from "../../model/lottery";
import { sendPushNotification } from "../../notification";
import { notificationBodies } from "../../notification/payloadBuiler";
import { BuilderNames } from "../../notification/types";
import { redisClient } from "../../redis";
import { ONE_DAY, getFormattedTime } from "../../util/time";
import { formatDollarNumber } from "../../util/utils";
import { AbstractScheduler } from "../AbstractScheduler";
import { MainrArgs } from "../types";

export class LotteryUserOnBoardingScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains });
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ chainId: network, subscribers: users }: MainrArgs<Address>) {
            try {
                  const keysToSet: string[] = [];
                  const { currentLottery, existingLotteryPlayers } = await getLotteryInformation(users);
                  const userTimestampKeys = redisClient.getUserTimestampKeys(
                        network,
                        this.job.jobId,
                        users,
                  );
                  const existResults = await redisClient.existMultipleData({ keys: userTimestampKeys });

                  const newUsers: Address[] = [];
                  const existingUsers: Address[] = [];
                  for (let userIndex = 0; userIndex < users.length; userIndex++) {
                        const user = users[userIndex];
                        if (existResults[userIndex]) continue;

                        keysToSet.push(userTimestampKeys[userIndex]);
                        newUsers.push(user);
                  }

                  for (const existingUser of existingLotteryPlayers) {
                        const isUserEntered = existingUser.rounds.some(
                              (round: UserFlattenedRoundData) =>
                                    round.lotteryId === currentLottery.id && round.status === "open",
                        );
                        const account = existingUser.account;
                        if (!isUserEntered) continue;
                        existingUsers.push(getAddress(account));
                  }

                  await this.buildAndSendNotification(newUsers, keysToSet, "newUsers");
                  await this.buildAndSendNotification(existingUsers, keysToSet, "existingUsers");
            } catch (error) {
                  this.buildErrorMessage(error, network);
            }
      }

      private async buildAndSendNotification(
            usersDueForNotification: Address[],
            keysToSet: string[],
            userType: "newUsers" | "existingUsers",
      ) {
            if (usersDueForNotification.length === 0) return;

            const { endTime, id } = await getCurrentLotteryEntity();
            const formattedTimeString = getFormattedTime(Number(endTime));

            let body: string;
            if (userType === "newUsers") {
                  const { totalPrizeInUsd, prizeAmountInCake } = await getLotteryPrizeInCake(
                        id,
                        this.getClient(ChainId.BSC),
                  );

                  body = notificationBodies["lottery1"](
                        formattedTimeString,
                        formatDollarNumber(totalPrizeInUsd),
                        formatDollarNumber(prizeAmountInCake),
                  );
            } else {
                  body = notificationBodies["lottery2"](formattedTimeString);
            }

            await sendPushNotification(
                  BuilderNames.lotteryNotification,
                  [usersDueForNotification, body],
                  usersDueForNotification,
            );

            await redisClient.setMultipleDataWithExpiration(keysToSet, "lottery notified", ONE_DAY * 5);
            this.job.log.info(`${this.job.jobId} sent to ${usersDueForNotification.length} users`);
      }
}

export class LotteryRoundResultsScheduler extends AbstractScheduler<Address, MainrArgs<Address>> {
      constructor(jobId: string, schedule: string, supportedChains: ChainId[]) {
            super({ jobId, schedule, supportedChains });
      }

      public async init(chainId: ChainId) {
            await this.executeCronTask({ chainId });
      }

      async mainFunction({ subscribers: users }: MainrArgs<Address>) {
            try {
                  const { currentLottery, existingLotteryPlayers } = await getLotteryInformation(
                        users,
                        2,
                  );
                  if (
                        !(await redisClient.getSingleData<boolean | null>(currentLottery.id)) &&
                        currentLottery.status === "claimable"
                  ) {
                        const winnersArray: Address[] = [];
                        for (const existingUser of existingLotteryPlayers) {
                              const isUserEntered = existingUser.rounds.some(
                                    (round: UserFlattenedRoundData) =>
                                          round.lotteryId === currentLottery.id &&
                                          round.status === "claimable",
                              );
                              if (isUserEntered) {
                                    const { winningTickets: usersTicketsResults } =
                                          await fetchUserTicketsForOneRound(
                                                existingUser.account,
                                                currentLottery.id,
                                                currentLottery.finalNumber,
                                                this.getClient(ChainId.BSC),
                                          );
                                    const winningTickets = usersTicketsResults?.filter(
                                          (ticket) => ticket.status,
                                    );
                                    if (winningTickets?.length)
                                          winnersArray.push(getAddress(existingUser.account));
                              }
                        }

                        this.buildAndSendNotification(winnersArray, currentLottery.id);
                  }
                  this.job.stopCronJob();
                  this.schedule = await this.calculateNewCronSchedule(
                        Number((await getCurrentLotteryEntity()).endTime),
                        30,
                        0,
                  );
                  console.log(this.job.jobId, this.schedule);
                  this.executeCronTask({ chainId: ChainId.BSC, subscribers: users });
            } catch (error) {
                  console.error("Error fetching Lottery data:", error);
            }
      }

      private async buildAndSendNotification(winnersArray: Address[], currentLotteryId: string) {
            if (winnersArray.length === 0) return;

            const body = notificationBodies["lottery3"](currentLotteryId);

            await sendPushNotification(
                  BuilderNames.lotteryNotification,
                  [winnersArray, body],
                  winnersArray,
            );
            await redisClient.setSignleData(currentLotteryId, true);
            this.job.log.info(`${this.job.jobId} sent to ${winnersArray.length} users`);
      }
}
