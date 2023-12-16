import BigNumber from "bignumber.js";
import { Address, PublicClient } from "viem";
import {
      CampaignIdInfoResponse,
      ClaimTimeDetails,
      RewardType,
      UseAllUserCampaignInfoProps,
      UserCampaignInfoDetail,
      UserCampaignInfoResponse,
} from "../../model/tradingFeeAPI";
import { tradingRewardABI } from "../../abi/tradingRewardAbi";
import { redisClient } from "../../redis";
import { CampaignIdsApiResponse, RankListApiResponse, Trader } from "../../model/tradingFeeAPI";
import { TRADING_REWARD_API } from "../../provider/constants";

export const getUserCampaignInfo = async ({
      campaignId,
      type,
      account,
      client,
}: UseAllUserCampaignInfoProps & {
      account: Address;
      client: PublicClient;
}): Promise<UserCampaignInfoDetail> => {
      const tradingRewardAddress = getTradingRewardAddress(type);

      try {
            const [userCampaignInfoResponse, userInfoQualificationResponse] = await Promise.all([
                  fetch(
                        `${TRADING_REWARD_API}/campaign/campaignId/${campaignId}/address/${account}/type/${type}`,
                  ),
                  fetch(
                        `${TRADING_REWARD_API}/user/campaignId/${campaignId}/address/${account}/type/${type}`,
                  ),
            ]);

            const [userCampaignInfoResult, userInfoQualificationResult] = await Promise.all([
                  userCampaignInfoResponse.json(),
                  userInfoQualificationResponse.json(),
            ]);

            const userCampaignInfo: CampaignIdInfoResponse = userCampaignInfoResult.data;
            const userInfoQualification: UserCampaignInfoResponse =
                  userInfoQualificationResult.data;

            const totalEstimateRewardUSD = userCampaignInfo.tradingFeeArr
                  .map((i) => i.estimateRewardUSD)
                  .reduce((a, b) => new BigNumber(a).plus(b).toNumber(), 0);

            const claimTimes = await redisClient.getSingleData<ClaimTimeDetails>(
                  `${campaignId}${type}`,
            );
            const userClaimedIncentives = await client.readContract({
                  abi: tradingRewardABI,
                  address: tradingRewardAddress,
                  functionName: "userClaimedIncentives",
                  args: [campaignId, account],
            });

            return {
                  ...userInfoQualification,
                  ...claimTimes,
                  totalEstimateRewardUSD,
                  campaignId,
                  userClaimedIncentives,
            };
      } catch (error) {
            console.info(`Fetch All User Campaign Info Error: ${error}`);
            return {} as UserCampaignInfoDetail;
      }
};

export const fetchCampaignIdsIncentive = async (
      campaignId: string,
      client: PublicClient,
      type: RewardType,
) => {
      const tradingRewardAddress = getTradingRewardAddress(type);

      const [incentivesResult, qualification] = await client.multicall({
            contracts: [
                  {
                        abi: tradingRewardABI,
                        address: tradingRewardAddress,
                        functionName: "incentives",
                        args: [campaignId],
                  },
                  {
                        abi: tradingRewardABI,
                        address: tradingRewardAddress,
                        functionName: "getUserQualification",
                  },
            ],
            allowFailure: false,
      });

      const thresholdLockTime = new BigNumber(qualification[0].toString()).toNumber();
      const campaignClaimEndTime = new BigNumber(incentivesResult[6].toString()).toNumber();
      const campaignClaimTime = new BigNumber(incentivesResult[5].toString()).toNumber();
      const isActivated = incentivesResult[7];

      redisClient.setSignleData(`${campaignId}${type}`, {
            campaignClaimTime,
            campaignClaimEndTime,
            isActivated,
            thresholdLockTime,
      } as ClaimTimeDetails);
};

export const getCurrentCampaignId = async (type: RewardType): Promise<string> => {
      try {
            const campaignsResponse = await fetch(
                  `${TRADING_REWARD_API}/campaign/status/0/type/${type}`,
            );
            const campaignsResult: CampaignIdsApiResponse = await campaignsResponse.json();
            const campaignIds = campaignsResult.data;
            const currentCampaignId = campaignIds[campaignIds.length - 1];
            return currentCampaignId;
      } catch (err) {
            console.error(err);
            // throw err;
      }
};

export const getRankDetailsForCampaigns = async (campaignId: string): Promise<Address[]> => {
      try {
            const rankListResponse = await fetch(
                  `${TRADING_REWARD_API}/rank_list/campaignId/${campaignId}/type/${RewardType.TOP_TRADERS}/page/1/size/100`,
            );
            const rankListResult: RankListApiResponse = await rankListResponse.json();
            const rankList = rankListResult.data.topTradersArr;
            return rankList.length > 0
                  ? rankList.map((trader: Trader) => trader.origin as Address)
                  : [];
      } catch (err) {
            console.log(err);
      }
};

const getTradingRewardAddress = (type: RewardType) =>
      type === RewardType.CAKE_STAKERS
            ? "0xa842a4AD40FEbbd034fbeF25C7a880464a90e695"
            : "0x41920b6A17CB73D1B60f4F41D82c35eD0a46fD71";
