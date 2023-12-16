export interface LotteryTicket {
      id: string;
      number: string;
      status: boolean;
      rewardBracket?: number;
      roundId?: string;
      cakeReward?: string;
}

export interface UserGQLRoundData {
      lottery: {
            id: string;
            endTime: string;
            status: string;
      };
      claimed: string;
      totalTickets: string;
}

export interface UserFlattenedRoundData {
      lotteryId: string;
      endTime: string;
      status: string;
      claimed: string;
      totalTickets: string;
}

export interface UserLotteryData<T> {
      account: string;
      totalCake: string;
      totalTickets: string;
      rounds: T[];
}

// lottery
export interface UserGQLRoundData {
      lottery: {
            id: string;
            endTime: string;
            status: string;
      };
      claimed: string;
      totalTickets: string;
}

export interface UserFlattenedRoundData {
      lotteryId: string;
      endTime: string;
      status: string;
      claimed: string;
      totalTickets: string;
}

export interface UserLotteryData<T> {
      account: string;
      totalCake: string;
      totalTickets: string;
      rounds: T[];
}

export interface UserLotteryState {
      timestamp: string;
      address: string;
      rounds: CachedUserLottery[];
}

export interface LotteryData {
      id: string;
      totalUsers: string;
      totalTickets: string;
      winningTickets: string;
      status: string;
      finalNumber: string;
      startTime: string;
      endTime: string;
      ticketPrice: string;
}

interface CachedUserLottery extends LotteryData {
      hasWon: boolean;
      hasClaimed: boolean;
      recievedEndAlert: boolean;
      recievedWinAlert: boolean;
}

// lottery contract
export type WinningTicket = {
      userTicketId: string;
      claimed: boolean;
      claimedReward: string;
};

export type GetWinningTicketsResult = {
      allWinningTickets: {
            roundId: string;
            id: any;
            number: any;
            status: any;
            rewardBracket: number;
      }[];
      cakeTotal: string[] | null;
      roundId: string;
};
