import { gql, request, Variables } from "graphql-request";
import { UserPosition, BatchPools, TickRange } from "../../model//userPositions";
import { getGraphUrl } from "..";
import { createPoolQueryName } from "./getPools";
import fs from "fs/promises";

export interface BatchRequestQueryAndVars {
      query: string;
      variables: Variables;
}

export function getBatchRequestQueryAndVars(
      batchPools: BatchPools[],
      users: string[],
): BatchRequestQueryAndVars {
      const variables: Variables = {};
      let query = "query(";
      let subQuery = "";

      variables[`owners`] = users;
      batchPools.forEach((batchPool) => {
            const { poolId, tick, tickRangeOut, lastTimeStamp } = batchPool;
            const poolIdVar = `poolId${poolId}`;
            const tickVar = `tick${poolId}`;
            const lastTimeStampVar = `lastTimeStamp${poolId}`;

            variables[poolIdVar] = poolId;
            variables[tickVar] = tick;
            variables[lastTimeStampVar] = lastTimeStamp;

            query += `$${poolIdVar}: String, $${tickVar}: Int, $${lastTimeStampVar}: Int, $owners: [String],`;
            subQuery += userPositionsSubQuery(poolId, tickRangeOut, tick, lastTimeStamp);
      });

      query = `${query.slice(0, -1)}) { ${subQuery} }`;

      return { query, variables };
}

function userPositionsSubQuery(
      poolId: string,
      tickRangeOut: TickRange,
      tick: number,
      lastTimeStamp?: number,
): string {
      const tickQuery = ` ${
            tickRangeOut === "tickLower" ? "tickLower_gt" : "tickUpper_lt"
      }: $tick${poolId} `;
      const lastTimeStampQuery = lastTimeStamp
            ? ` createdAtTimestamp_gte: $lastTimeStamp${poolId} `
            : "";

      const uq = ` originOwner_in: $owners `; // Use userAddressesVar

      return `${createPoolQueryName(poolId, tick)}: userPositions(
    first: 1000
    orderBy: createdAtTimestamp
    orderDirection: asc
    where: ${
          "{" + ` liquidity_gt: 0 pool: $poolId${poolId} ` + tickQuery + uq + lastTimeStampQuery + "}"
    }
  ) {
    id
    pool {
      id
      token0 {id, name, decimals}
      token1 {id, name, decimals}
    }
    owner
    liquidity
    tickLower
    tickUpper
    createdAtBlockNumber
    createdAtTimestamp
  }\n`;
}
// ... (other imports)

export async function getBatchUserPositionOutOfRange(
      networkId: number,
      batchPools: BatchPools[],
      users: string[],
): Promise<Map<string, UserPosition[]>> {
      const url = getGraphUrl(networkId);
      const batchSize = 40; // You can adjust the batch size based on your server's limit

      // Split batchPools into smaller batches
      const batches = [];
      for (let i = 0; i < batchPools.length; i += batchSize) {
            batches.push(batchPools.slice(i, i + batchSize));
      }

      // Execute batches in parallel
      const promises = batches.map(async (batch) => {
            const { query, variables } = getBatchRequestQueryAndVars(batch, users);
            try {
                  return await request<Object>(url, query, variables);
            } catch (error) {
                  console.error(error);
                  return {};
            }
      });

      const responses = await Promise.all(promises);

      const resultMap = new Map<string, UserPosition[]>();
      responses.forEach((response) => {
            Object.entries(response).forEach(([key, value]) => {
                  resultMap.set(key, value as UserPosition[]);
            });
      });

      return resultMap;
}

async function fetchDataAndProcessOwners() {
      const url = getGraphUrl(56);
      const pageSize = 1000; // Adjust the page size as needed

      const targetPage = 5; // Set the target page number

      let skip = 0;
      let currentPage = 0;
      let hasNextPage = true;
      const ownersArray = [];

      try {
            while (hasNextPage) {
                  let i = 0;
                  // Fetch data from GraphQL with pagination variables
                  const data = (await request(
                        url,
                        gql`
                              query MyQuery($first: Int, $skip: Int) {
                                    userPositions(first: $first, skip: $skip) {
                                          id
                                          owner
                                          pool {
                                                id
                                                token0 {
                                                      id
                                                      name
                                                      decimals
                                                }
                                                token1 {
                                                      id
                                                      name
                                                      decimals
                                                }
                                          }
                                          tickLower
                                          tickUpper
                                          liquidity
                                          createdAtTimestamp
                                    }
                              }
                        `,
                        { first: pageSize, skip },
                  )) as any;

                  // Process data and extract unique owners
                  // const ownersArray = [];

                  data.userPositions.forEach((userPosition, index) => {
                        const { owner } = userPosition;

                        if (!ownersArray.includes(owner)) {
                              ownersArray.push(owner);
                        }
                  });

                  // Print the resulting owners array
                  // console.log(i);
                  if (currentPage >= targetPage) {
                        break;
                  }

                  // Update pagination variables
                  skip += pageSize;
                  hasNextPage = data.userPositions.length === pageSize;
                  currentPage++;
            }
            console.log(ownersArray);
            await fs.writeFile("ownersArray.txt", JSON.stringify(ownersArray, null, 2));
      } catch (error) {
            console.error("Error fetching and processing data:", error.message);
      }
}
// fetchDataAndProcessOwners();
