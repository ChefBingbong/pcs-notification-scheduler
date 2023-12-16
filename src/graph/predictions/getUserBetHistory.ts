import request, { gql } from "graphql-request";
import { Address, getAddress } from "viem";
import { PredictionRound, PredictionRoundsData } from "../../model/prediction";

export const getPredictionUsersData = async (
      api: string,
      currentRound: string,
      accounts: string[],
): Promise<{ winners: Address[]; loosers: Address[] }> => {
      const response: {
            bets: {
                  id: string;
                  position: string;
                  claimed: boolean;
                  user: {
                        id: string;
                  };
                  round: {
                        id: string;
                        position: "Bull" | "Bear" | "House";
                        failed: boolean;
                  };
            }[];
      } = await request(
            api,
            gql`
                  query getUsers($account: [ID!]!) {
                        bets(
                              first: 1
                              where: { user_in: $account }
                              orderBy: round__startAt
                              orderDirection: desc
                        ) {
                              id
                              user {
                                    id
                              }
                              position
                              claimed
                              round {
                                    id
                                    position
                                    failed
                              }
                        }
                  }
            `,
            {
                  account: accounts.map((account) => account.toLowerCase()),
            },
      );

      const winners: Address[] = [];
      const loosers: Address[] = [];
      for (const bet of response.bets) {
            if (bet.round.id !== currentRound) continue;
            if (bet.round.position === bet.position && !bet.claimed)
                  winners.push(getAddress(bet.user.id));
            else loosers.push(getAddress(bet.user.id));
      }
      return {
            winners,
            loosers,
      };
};

export const getPredictionRoundsWinners = async (api: string): Promise<PredictionRound> => {
      const response: PredictionRoundsData = await request(
            api,
            gql`
                  query GetPredictionRounds {
                        rounds(first: 1, orderBy: startAt, orderDirection: desc) {
                              id
                              epoch
                              startAt
                              closeAt
                              bets {
                                    id
                                    user {
                                          id
                                    }
                                    amount
                                    claimed
                              }
                        }
                  }
            `,
      );

      return response.rounds[0];
};
// getPredictionRoundsWinners(GRAPH_API_PREDICTION_CAKE).then((r) => console.log(r[0]));
// getPredictionUsersData(GRAPH_API_PREDICTION_CAKE, "151511", [
//       "0xCFe43a25b32C9C3308FaA16F7e0994e31ed73eF5".toLowerCase(),
//       "0xe840B5CB0309f267a93dd9113Da65ffceb5E703b".toLowerCase(),
// ]).then((r) => console.log(r));
