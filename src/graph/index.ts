export const getGraphUrl = (networkId: number) => {
      let graphUrl = "https://api.thegraph.com/subgraphs/name/pancakeswap/user-positions-v3-eth";
      switch (networkId) {
            case 1:
                  graphUrl =
                        "https://api.thegraph.com/subgraphs/name/pancakeswap/user-positions-v3-eth";
                  break;
            case 56:
                  graphUrl =
                        "https://api.thegraph.com/subgraphs/name/pancakeswap/user-positions-v3-bsc";
                  break;
      }
      return graphUrl;
};
