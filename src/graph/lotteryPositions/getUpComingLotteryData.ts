const LOTTERY_GRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/pancakeswap/lottery";
import request, { gql } from "graphql-request";
import {
      UserFlattenedRoundData,
      UserGQLRoundData,
      UserLotteryData,
      LotteryData,
} from "../../model/lottery";
import { Address } from "viem";
export const MAX_LOTTERIES_REQUEST_SIZE = 1;

export const getUserLotteryInformation = async (
      accounts: string[],
      where = { id_in: accounts },
): Promise<UserLotteryData<UserFlattenedRoundData>[]> => {
      try {
            const userLotteryInfoResponse: {
                  users: Omit<UserLotteryData<UserGQLRoundData> & { id: string }, "account">[];
            } = await request(
                  LOTTERY_GRAPH_ENDPOINT,
                  gql`
                        query getUserLotteries($account: [ID!]!, $where: Round_filter) {
                              users(
                                    where: { id_in: $account }
                                    orderBy: timestamp
                                    orderDirection: desc
                              ) {
                                    id
                                    totalTickets
                                    totalCake
                                    rounds(first: 3, orderDirection: desc, orderBy: id) {
                                          id
                                          lottery {
                                                id
                                                endTime
                                                status
                                          }
                                          claimed
                                          totalTickets
                                    }
                              }
                        }
                  `,
                  { account: [...accounts], where },
            );

            const userLotteryInfoResult = userLotteryInfoResponse.users;
            if (!userLotteryInfoResult) return [];

            const usersInformation: UserLotteryData<UserFlattenedRoundData>[] =
                  userLotteryInfoResult.map(
                        (
                              user: Omit<
                                    UserLotteryData<UserGQLRoundData> & {
                                          id: string;
                                    },
                                    "account"
                              >,
                        ) => {
                              return {
                                    account: user.id,
                                    totalCake: user.totalCake,
                                    totalTickets: user.totalTickets,
                                    rounds: user.rounds.map((round) => {
                                          return {
                                                lotteryId: round?.lottery?.id,
                                                endTime: round?.lottery?.endTime,
                                                claimed: round?.claimed,
                                                totalTickets: round?.totalTickets,
                                                status: round?.lottery?.status.toLowerCase(),
                                          };
                                    }),
                              };
                        },
                  );
            return usersInformation;
      } catch (error) {
            console.error("failed to get user lottery info", error);
            return [];
      }
};

export const getCurrentLotteryEntity = async (
      first: number = MAX_LOTTERIES_REQUEST_SIZE,
      where: Object = {},
): Promise<LotteryData> => {
      try {
            const response: { lotteries: LotteryData[] } = await request(
                  LOTTERY_GRAPH_ENDPOINT,
                  gql`
                        query getLotteries($where: Lottery_filter, $first: Int) {
                              lotteries(orderDirection: desc, first: $first, orderBy: timestamp) {
                                    id
                                    totalUsers
                                    totalTickets
                                    winningTickets
                                    status
                                    finalNumber
                                    startTime
                                    endTime
                                    ticketPrice
                              }
                        }
                  `,
                  { where, first },
            );
            return first === 2 ? response.lotteries[1] : response.lotteries[0];
      } catch (error) {
            console.error(error);
            return {} as LotteryData;
      }
};

export const getLotteryInformation = async (
      users: Address[],
      lotteryIndex?: number,
): Promise<{
      currentLottery: LotteryData;
      existingLotteryPlayers: UserLotteryData<UserFlattenedRoundData>[];
}> => {
      const currentLottery = await getCurrentLotteryEntity(lotteryIndex);
      const existingLotteryPlayers = await getUserLotteryInformation(
            users.map((user) => user.toLowerCase()),
      );

      return { currentLottery, existingLotteryPlayers };
};

// getCurrentLotteryEntity().then((r) => console.log(r));
// getUserLotteryInformation(["0x909D6f1ddC95f509091CaBf9B158eAA85868404e".toLowerCase()]).then((r) =>
//   console.log(r[0].rounds)
// );
// test lotter winner for lotter id 996 0xe2746f4f629d01988ffff83891872282e7cdc12e finalNumber 1497298
