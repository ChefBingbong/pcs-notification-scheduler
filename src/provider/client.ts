import { ChainId } from "@pancakeswap/chains";
import { Chain, Client, PublicClient, createPublicClient, fallback, http } from "viem";
import { CHAINS, PUBLIC_NODES } from "./chains";

export type viemAddress = `0x${string}`;

const createClients = <TClient extends PublicClient>(chains: Chain[]): Record<ChainId, TClient> => {
      return chains.reduce(
            (prev, cur) => {
                  const clientConfig = {
                        chain: cur,
                        transport: fallback(
                              (PUBLIC_NODES[cur.id] as string[]).map((url) =>
                                    http(url, {
                                          timeout: 15_000,
                                    }),
                              ),
                              {
                                    rank: false,
                              },
                        ),
                        batch: {
                              multicall: {
                                    batchSize: cur.id === ChainId.POLYGON_ZKEVM ? 128 : 154 * 200,
                                    wait: 16,
                              },
                        },
                  };
                  const client = createPublicClient(clientConfig);
                  return {
                        ...prev,
                        [cur.id]: client,
                  };
            },
            {} as Record<ChainId, TClient>,
      );
};

const publicClients = createClients<PublicClient>(CHAINS);

export const getViemClient = ({ chainId }: { chainId?: ChainId }) => {
      return publicClients[chainId!];
};
