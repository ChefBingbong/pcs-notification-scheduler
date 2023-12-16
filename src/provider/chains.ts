import { ChainId } from "@pancakeswap/chains";
import {
      bsc,
      bscTestnet,
      goerli,
      mainnet,
      zkSync,
      polygonZkEvm,
      arbitrum,
      base,
      scrollSepolia,
      arbitrumGoerli,
      baseGoerli,
      opBNBTestnet,
      zkSyncTestnet,
      linea,
      lineaTestnet,
      polygonZkEvmTestnet,
      opBNB,
} from "viem/chains";

export const CHAINS = [
      bsc,
      bscTestnet,
      goerli,
      mainnet,
      zkSync,
      polygonZkEvm,
      polygonZkEvmTestnet,
      arbitrum,
      base,
      scrollSepolia,
      arbitrumGoerli,
      baseGoerli,
      opBNBTestnet,
      zkSyncTestnet,
      opBNB,
      linea,
      lineaTestnet,
];

const POLYGON_ZKEVM_NODES = [
      "https://f2562de09abc5efbd21eefa083ff5326.zkevm-rpc.com/",
      ...polygonZkEvm.rpcUrls.public.http,
];

const ARBITRUM_NODES = [
      ...arbitrum.rpcUrls.public.http,
      "https://arbitrum-one.publicnode.com",
      "https://arbitrum.llamarpc.com",
].filter(Boolean);

export const PUBLIC_NODES = {
      [ChainId.BSC]: [
            "https://bsc.publicnode.com",
            "https://binance.llamarpc.com",
            "https://bsc-dataseed1.defibit.io",
            "https://bsc-dataseed1.binance.org",
      ].filter(Boolean),
      [ChainId.BSC_TESTNET]: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
      [ChainId.ETHEREUM]: [
            "https://ethereum.publicnode.com",
            "https://eth.llamarpc.com",
            "https://cloudflare-eth.com",
      ].filter(Boolean),
      [ChainId.GOERLI]: ["https://eth-goerli.public.blastapi.io"].filter(Boolean),
      [ChainId.ARBITRUM_ONE]: [...ARBITRUM_NODES].filter(Boolean),
      [ChainId.ARBITRUM_GOERLI]: arbitrumGoerli.rpcUrls.public.http,
      [ChainId.POLYGON_ZKEVM]: [...POLYGON_ZKEVM_NODES],
      [ChainId.POLYGON_ZKEVM_TESTNET]: ["https://polygon-zkevm-testnet.rpc.thirdweb.com"],
      [ChainId.ZKSYNC_TESTNET]: zkSyncTestnet.rpcUrls.public.http,
      [ChainId.LINEA]: linea.rpcUrls.public.http,
      [ChainId.LINEA_TESTNET]: [
            "https://rpc.goerli.linea.build",
            "https://linea-testnet.rpc.thirdweb.com",
            "https://consensys-zkevm-goerli-prealpha.infura.io/v3/93e8a17747e34ec0ac9a554c1b403965",
      ],
      [ChainId.ZKSYNC]: [...zkSync.rpcUrls.public.http],
      [ChainId.OPBNB_TESTNET]: opBNBTestnet.rpcUrls.public.http,
      [ChainId.OPBNB]: ["https://opbnb.publicnode.com"],
      [ChainId.BASE]: ["https://base.publicnode.com", ...base.rpcUrls.public.http].filter(Boolean),
      [ChainId.BASE_TESTNET]: baseGoerli.rpcUrls.public.http,
      [ChainId.SCROLL_SEPOLIA]: scrollSepolia.rpcUrls.public.http,
} as any;

export enum SupportedChain {
      ZKEVM = 1101,
      ZKSYNC = 324,
      ARB = 42161,
      LINEA = 59144,
      BASE = 8453,
      ETH = 1,
      BSC = 56,
      GOERLI = 5,
      BSC_TESTNET = 97,
      OP_BNB = 204,
}

export const CHAIN_ID_TO_CHAIN_NAME = {
      [ChainId.BSC]: "bsc",
      [ChainId.ETHEREUM]: "ethereum",
      [ChainId.GOERLI]: "ethereum",
      [ChainId.BSC_TESTNET]: "bsc",
      [ChainId.POLYGON_ZKEVM]: "polygon_zkevm",
      [ChainId.ZKSYNC]: "era",
      [ChainId.ARBITRUM_ONE]: "arbitrum",
      [ChainId.LINEA]: "linea",
      [ChainId.BASE]: "base",
};

export const CHAIN_ID_TO_FORMATTED_NAME = {
      [ChainId.BSC]: "Binance Chain",
      [ChainId.ETHEREUM]: "Ethereum",
      [ChainId.GOERLI]: "Ethereum",
      [ChainId.BSC_TESTNET]: "bsc",
      [ChainId.POLYGON_ZKEVM]: "Polygon ZkEvm",
      [ChainId.ZKSYNC]: "ZkSync Era",
      [ChainId.ARBITRUM_ONE]: "Arbitrum",
      [ChainId.LINEA]: "Linea",
      [ChainId.BASE]: "Base",
};

export const CHAIN_ID_TO_SHORT_NAME = {
      [ChainId.BSC]: "BNB",
      [ChainId.BSC_TESTNET]: "tBNB",
      [ChainId.ETHEREUM]: "ETH",
      [ChainId.POLYGON_ZKEVM]: "POLYGON",
      [ChainId.ZKSYNC]: "ZKSYNC",
      [ChainId.ARBITRUM_ONE]: "ARB",
      [ChainId.LINEA]: "LINEA",
      [ChainId.BASE]: "BASE",
};
