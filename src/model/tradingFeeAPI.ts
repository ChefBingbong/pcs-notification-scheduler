import { ChainId } from "@pancakeswap/sdk";

export interface CampaignIdsApiResponse {
      code: number;
      data: string[];
}

export interface Trader {
      tradingFee: number;
      volume: number;
      origin: string;
      estimateRewardUSD: number;
      rank: number;
}

export interface RankListApiResponse {
      code: number;
      data: {
            topTradersArr: Trader[];
      };
}

export enum RewardType {
      CAKE_STAKERS = "rb",
      TOP_TRADERS = "tt",
}

export interface CampaignVolume {
      pool: string;
      volume: number;
      estimateRewardUSD: number;
      tradingFee: string;
      maxCap: number;
      chainId: ChainId;
}

export interface CampaignIdInfoResponse {
      total: number;
      tradingFeeArr: CampaignVolume[];
}

export interface UserCampaignInfoResponse {
      id: string;
      isActive: boolean;
      lockEndTime: number;
      lockStartTime: number;
      lockedAmount: number;
      createdAt: string;
      isQualified: boolean;
      thresholdLockedPeriod: number;
      thresholdLockedAmount: string;
      needsProfileActivated: boolean;
}

export interface ClaimTimeDetails {
      campaignClaimTime: number;
      campaignClaimEndTime: number;
      isActivated: boolean;
      thresholdLockTime: number;
}
export interface UserCampaignInfoDetail extends UserCampaignInfoResponse, ClaimTimeDetails {
      campaignId: string;
      userClaimedIncentives: boolean;
      totalEstimateRewardUSD: number;
}

export interface UseAllUserCampaignInfoProps {
      campaignId: string;
      type: RewardType;
}
