export interface Token {
      id: string;
      name: string;
      decimals: number;
}

export interface Pool {
      id: string;
      createdAtTimestamp: number;
      createdAtBlockNumber: number;
      txCount: number;
      token0: Token;
      token1: Token;
}

export interface UserPosition {
      id: string;
      createdAtTimestamp: number;
      createdAtBlockNumber: number;
      owner: string;
      pool: Pool;
      liquidity: number;
      tickLower: number;
      tickUpper: number;
}

export interface UserPositionsResponse {
      userPositions: UserPosition[];
}

export interface WhitelistedFarms {
      pools: string[];
      lastUpdateTimestamp: number;
}

export type TickRange = "tickLower" | "tickUpper";

export type BatchPools = {
      poolId: string;
      tick: number;
      tickRangeOut: TickRange;
      lastTimeStamp?: number;
};

export type tickeRanges = {
      tickUpper: BatchPools[];
      tickLower: BatchPools[];
};
