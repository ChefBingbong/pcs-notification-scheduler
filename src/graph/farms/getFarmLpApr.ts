import request, { gql } from "graphql-request";
import { Info, UsePoolAvgInfoParams } from "../../model/farms";
import { V3_SUBGRAPHS } from "@pancakeswap/chains";
import { averageArray } from "../../util/utils";

export const getFarmLpApr = async ({
      addresses = [""],
      numberOfDays = 7,
      chainId,
}: UsePoolAvgInfoParams): Promise<{ lpAprs: { [pool: string]: number } }> => {
      const getPoolVolume: { pools: { poolDayData: Info[] }[] } = await request(
            V3_SUBGRAPHS[chainId],
            gql`
                  query getVolume($days: Int!, $addresses: [String!]!) {
                        pools(where: { id_in: $addresses }) {
                              poolDayData(
                                    first: $days
                                    orderBy: date
                                    orderDirection: desc
                                    where: { pool_in: $addresses }
                              ) {
                                    id
                                    tvlUSD
                                    feesUSD
                                    protocolFeesUSD
                              }
                        }
                  }
            `,
            {
                  days: numberOfDays,
                  addresses: addresses.map((address) => address.toLocaleLowerCase()),
            },
      );
      const { pools } = getPoolVolume;
      const lpAprs = {};

      for (const pool of pools) {
            const { poolDayData } = pool;
            const feeUSDs = poolDayData.map(
                  (d: { feesUSD: string; protocolFeesUSD: string }) =>
                        Number(d.feesUSD) - Number(d.protocolFeesUSD),
            );
            const feeUSD = averageArray(feeUSDs);
            const tvlUSD = parseFloat(poolDayData[0]?.tvlUSD) || 0;
            lpAprs[poolDayData[0].id.substring(0, poolDayData[0].id.indexOf("-"))] =
                  tvlUSD && !Number.isNaN(tvlUSD) ? (100 * feeUSD * 365) / tvlUSD : 0;
      }
      return { lpAprs };
};
