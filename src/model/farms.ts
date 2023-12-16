import { ChainId } from "@pancakeswap/sdk";
import { Token } from "@pancakeswap/swap-sdk-core";
import { FeeAmount } from "@pancakeswap/v3-sdk";
import BigNumber from "bignumber.js";
import { Address } from "viem";

export type FarmPriceV3 = {
      tokenPriceBusd: string;
      quoteTokenPriceBusd: string;
};

export type FarmV3Data = {
      lmPool: string;
      lmPoolLiquidity: string;
      tokenPriceVsQuote: string;
      poolWeight: string;
      multiplier: string;
} & ComputedFarmConfigV3;

export type FarmV3DataWithPrice = FarmV3Data & FarmPriceV3;

export interface FarmsV3Response<T extends FarmV3DataWithPrice = FarmV3DataWithPrice> {
      chainId: number;
      poolLength: number;
      farmsWithPrice: T[];
      cakePerSecond: string;
      totalAllocPoint: string;
}

export type ComputedFarmConfigV3 = {
      pid: number;
      lpSymbol: string;
      lpAddress: Address;
      boosted?: boolean;

      token: Token;
      quoteToken: Token;
      feeAmount: FeeAmount;

      token0: Token;
      token1: Token;
      isCommunity?: boolean;
};

export type FarmConfigV3 = {
      pid: number;
      lpAddress: Address;
      boosted?: boolean;

      token0: Token;
      token1: Token;
      feeAmount: FeeAmount;
      isCommunity?: boolean;
};

export type Slot0 = [bigint, number, number, number, number, boolean];

export type LPTvl = {
      token0: string;
      token1: string;
      updatedAt: string;
};

export type TvlMap = {
      [key: string]: LPTvl | null;
};

export type BigNumberish = BigNumber | number | string;

export interface FarmAprParams {
      poolWeight: BigNumberish;
      tvlUsd: BigNumberish;
      cakePriceUsd: BigNumberish;
      cakePerSecond: BigNumberish;
      precision?: number;
}

export interface WhitelistedFarms {
      pools: string[];
      lastUpdateTimestamp: number;
}

export type FarmStorage = {
      farmId: number;
      apr: number;
      cachedApr: number;
};

export type FarmInfo = {
      tvls: TvlMap;
      farmIds: number[];
      farmSymbols: string[];
};

export interface UsePoolAvgInfoParams {
      chainId: ChainId;
      numberOfDays?: number;
      addresses?: string[];
}

export interface Info {
      id: string;
      tvlUSD: string;
      feesUSD: string;
      protocolFeesUSD: string;
}
