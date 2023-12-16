import { deserializeToken } from "@pancakeswap/token-lists";
import { CAKE } from "@pancakeswap/tokens";
import { default as BN, default as BigNumber } from "bignumber.js";
import {
      FarmAprParams,
      FarmV3Data,
      FarmV3DataWithPrice,
      FarmsV3Response,
      LPTvl,
} from "../../model/farms";
import { formatNumber, isValid } from "../../util/utils";
import { GlobalTaskScheduler } from "../../cron/GlobalTaskScheduler";

export const SECONDS_FOR_YEAR = 365 * 60 * 60 * 24;
export const BIG_ZERO = new BigNumber(0);

export const farmV3ApiFetch = (chainId: number): Promise<FarmsV3Response> =>
      fetch(`https://pancakeswap.finance/api/v3/${chainId}/farms`)
            .then((res) => res.json())
            .then((data: any) => {
                  const farmsWithPrice = data.farmsWithPrice.map((f) => ({
                        ...f,
                        token: deserializeToken(f.token),
                        quoteToken: deserializeToken(f.quoteToken),
                  }));
                  const farmsV3Data = { chainId, ...data, farmsWithPrice };
                  return farmsV3Data;
            });

export const getCakeAprAndTVL = (farm: FarmV3DataWithPrice, lpTVL: LPTvl, cakePerSecond: string) => {
      const [token0Price, token1Price] = farm.token.sortsBefore(farm.quoteToken)
            ? [farm.tokenPriceBusd, farm.quoteTokenPriceBusd]
            : [farm.quoteTokenPriceBusd, farm.tokenPriceBusd];
      const tvl = new BN(token0Price).times(lpTVL.token0).plus(new BN(token1Price).times(lpTVL.token1));

      const cakePrice = GlobalTaskScheduler.cakePrice;
      const cakeApr = getCakeApr(farm.poolWeight, tvl, cakePrice, cakePerSecond);

      return {
            activeTvlUSD: tvl.toString(),
            activeTvlUSDUpdatedAt: lpTVL.updatedAt,
            cakeApr: Number(cakeApr),
      };
};

export function getFarmApr({
      poolWeight,
      tvlUsd,
      cakePriceUsd,
      cakePerSecond,
      precision = 6,
}: FarmAprParams) {
      if (!isValid(poolWeight) || !isValid(tvlUsd) || !isValid(cakePriceUsd) || !isValid(cakePerSecond))
            return "0";

      const cakeRewardPerYear = new BigNumber(cakePerSecond).times(SECONDS_FOR_YEAR);
      const farmApr = new BigNumber(poolWeight)
            .times(cakeRewardPerYear)
            .times(cakePriceUsd)
            .div(tvlUsd)
            .times(100);
      if (farmApr.isZero()) return "0";

      return formatNumber(farmApr, precision);
}

export const getCakeApr = (
      poolWeight: string,
      activeTvlUSD: BigNumber,
      cakePriceUSD: string,
      cakePerSecond: string,
) => {
      return getFarmApr({
            poolWeight,
            tvlUsd: activeTvlUSD,
            cakePriceUsd: cakePriceUSD,
            cakePerSecond,
            precision: 6,
      });
};

export function getFarmsPrices(farms: FarmV3Data[], cakePriceUSD: string): FarmV3DataWithPrice[] {
      const commonPriceFarms = farms.map((farm) => {
            let tokenPriceBusd = BIG_ZERO;
            let quoteTokenPriceBusd = BIG_ZERO;

            // try price via CAKE
            if (
                  tokenPriceBusd.isZero() &&
                  farm.token.chainId in CAKE &&
                  farm.token.equals(CAKE[farm.token.chainId as keyof typeof CAKE])
            ) {
                  tokenPriceBusd = new BigNumber(cakePriceUSD);
            }
            if (
                  quoteTokenPriceBusd.isZero() &&
                  farm.quoteToken.chainId in CAKE &&
                  farm.quoteToken.equals(CAKE[farm.quoteToken.chainId as keyof typeof CAKE])
            ) {
                  quoteTokenPriceBusd = new BigNumber(cakePriceUSD);
            }

            // try to get price via token price vs quote
            if (tokenPriceBusd.isZero() && !quoteTokenPriceBusd.isZero() && farm.tokenPriceVsQuote) {
                  tokenPriceBusd = quoteTokenPriceBusd.times(farm.tokenPriceVsQuote);
            }
            if (quoteTokenPriceBusd.isZero() && !tokenPriceBusd.isZero() && farm.tokenPriceVsQuote) {
                  quoteTokenPriceBusd = tokenPriceBusd.div(farm.tokenPriceVsQuote);
            }

            return {
                  ...farm,
                  tokenPriceBusd,
                  quoteTokenPriceBusd,
            };
      });

      return commonPriceFarms.map((farm) => {
            let { tokenPriceBusd, quoteTokenPriceBusd } = farm;
            // if token price is zero, try to get price from existing farms
            if (tokenPriceBusd.isZero()) {
                  const ifTokenPriceFound = commonPriceFarms.find(
                        (f) =>
                              (farm.token.equals(f.token) && !f.tokenPriceBusd.isZero()) ||
                              (farm.token.equals(f.quoteToken) && !f.quoteTokenPriceBusd.isZero()),
                  );
                  if (ifTokenPriceFound) {
                        tokenPriceBusd = farm.token.equals(ifTokenPriceFound.token)
                              ? ifTokenPriceFound.tokenPriceBusd
                              : ifTokenPriceFound.quoteTokenPriceBusd;
                  }
                  if (quoteTokenPriceBusd.isZero()) {
                        const ifQuoteTokenPriceFound = commonPriceFarms.find(
                              (f) =>
                                    (farm.quoteToken.equals(f.token) && !f.tokenPriceBusd.isZero()) ||
                                    (farm.quoteToken.equals(f.quoteToken) &&
                                          !f.quoteTokenPriceBusd.isZero()),
                        );
                        if (ifQuoteTokenPriceFound) {
                              quoteTokenPriceBusd = farm.quoteToken.equals(ifQuoteTokenPriceFound.token)
                                    ? ifQuoteTokenPriceFound.tokenPriceBusd
                                    : ifQuoteTokenPriceFound.quoteTokenPriceBusd;
                        }

                        // try to get price via token price vs quote
                        if (
                              tokenPriceBusd.isZero() &&
                              !quoteTokenPriceBusd.isZero() &&
                              farm.tokenPriceVsQuote
                        ) {
                              tokenPriceBusd = quoteTokenPriceBusd.times(farm.tokenPriceVsQuote);
                        }
                        if (
                              quoteTokenPriceBusd.isZero() &&
                              !tokenPriceBusd.isZero() &&
                              farm.tokenPriceVsQuote
                        ) {
                              quoteTokenPriceBusd = tokenPriceBusd.div(farm.tokenPriceVsQuote);
                        }

                        if (tokenPriceBusd.isZero()) {
                              console.error(`Can't get price for ${farm.token.address}`);
                        }
                        if (quoteTokenPriceBusd.isZero()) {
                              console.error(`Can't get price for ${farm.quoteToken.address}`);
                        }
                  }
            }

            return {
                  ...farm,
                  tokenPriceBusd: tokenPriceBusd.toString(),
                  // adjust the quote token price by the token price vs quote
                  quoteTokenPriceBusd:
                        !quoteTokenPriceBusd.isZero() && farm.tokenPriceVsQuote
                              ? tokenPriceBusd.div(farm.tokenPriceVsQuote).toString()
                              : quoteTokenPriceBusd.toString(),
            };
      });
}
