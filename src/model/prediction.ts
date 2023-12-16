type WhereClause = Record<string, string | number | boolean | string[]>;

export interface GetPredictionUsersOptions {
      skip?: number;
      first?: number;
      orderBy?: string;
      orderDir?: string;
      where?: WhereClause;
}
export interface UserResponse<BetType> {
      id: string;
      createdAt: string;
      updatedAt: string;
      block: string;
      totalBets: string;
      totalBetsBull: string;
      totalBetsBear: string;
      totalBetsClaimed: string;
      winRate: string;
      averageBNB: string;
      bets?: BetType[];
}

export interface BetResponse {
      id: string;
      hash: string;
      amount: string;
      position: string;
      claimed: boolean;
      claimedAt: string;
      claimedBlock: string;
      claimedHash: string;
      createdAt: string;
      updatedAt: string;
      block: string;
}

type Round = {
      id: string;
      epoch: string;
      position: string;
      failed: boolean;
      startAt: string;
      startBlock: string;
      startHash: string;
      lockAt: string;
      lockBlock: string;
      lockHash: string;
      lockPrice: string;
      lockRoundId: string;
      closeAt: string;
      closeBlock: string;
      closeHash: string;
      closePrice: string;
      closeRoundId: string;
      totalBets: string;
      totalAmount: string;
      bullBets: string;
      bullAmount: string;
      bearBets: string;
      bearAmount: string;
};

type Bet = {
      id: string;
      hash: string;
      amount: string;
      position: string;
      claimed: boolean;
      claimedAt: string;
      claimedHash: string;
      claimedBlock: string;
      claimedCAKE: string;
      claimedNetCAKE: string;
      createdAt: string;
      updatedAt: string;
      round: Round;
};

export type UserRound = {
      id: string;
      createdAt: string;
      updatedAt: string;
      block: string;
      totalBets: string;
      totalBetsBull: string;
      totalBetsBear: string;
      totalCAKE: string;
      totalCAKEBull: string;
      totalCAKEBear: string;
      totalBetsClaimed: string;
      totalCAKEClaimed: string;
      winRate: string;
      averageCAKE: string;
      netCAKE: string;
      bets: Bet[];
};

export type PredictionUsersResponse = {
      users: UserRound[];
};

type User = {
      id: string;
};

type RoundsBet = {
      id: string;
      user: User;
      amount: string;
      claimed: boolean;
};

export type PredictionRound = {
      id: string;
      epoch: string;
      startAt: string;
      closeAt: string;
      bets: RoundsBet[];
};

export type PredictionRoundsData = {
      rounds: PredictionRound[];
};
