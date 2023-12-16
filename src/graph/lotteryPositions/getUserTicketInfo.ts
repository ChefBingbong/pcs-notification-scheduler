import { lotteryV2ABI } from "../../abi/lotteryV2ABI";
import { LotteryTicket } from "../../model/lottery";
import BigNumber from "bignumber.js";
import { PublicClient, formatUnits } from "viem";
import { chainlinkOracleABI } from "../../abi/chainLinkOracleABI";
import { CHAINLINK_ORACLE_ADDRESS, LOTTERY_CONTRACT_ADDRESS } from "../../provider/constants";
import { GetWinningTicketsResult } from "../../model/lottery";
import { GlobalTaskScheduler } from "../../cron/GlobalTaskScheduler";

const TICKET_LIMIT_PER_REQUEST = 2500;

export const viewUserInfoForLotteryId = async (
      account: string,
      lotteryId: string,
      cursor: number,
      perRequestLimit: number,
      provider: PublicClient,
): Promise<LotteryTicket[]> => {
      try {
            const data = await provider.readContract({
                  abi: lotteryV2ABI,
                  address: LOTTERY_CONTRACT_ADDRESS,
                  functionName: "viewUserInfoForLotteryId",
                  args: [account as any, BigInt(lotteryId), BigInt(cursor), BigInt(perRequestLimit)],
            });

            const [ticketIds, ticketNumbers, ticketStatuses] = data;

            if (ticketIds?.length > 0) {
                  return ticketIds.map((ticketId: any, index: number) => {
                        return {
                              id: ticketId.toString(),
                              number: ticketNumbers[index].toString(),
                              status: ticketStatuses[index],
                        };
                  });
            }
            return [];
      } catch (error) {
            console.error("viewUserInfoForLotteryId", error);
            return [];
      }
};

export const fetchUserTicketsForOneRound = async (
      account: string,
      lotteryId: string,
      finalNumber: string,
      provider: PublicClient,
) => {
      let cursor = 0;
      let numReturned = TICKET_LIMIT_PER_REQUEST;
      const ticketData = [] as LotteryTicket[];

      while (numReturned === TICKET_LIMIT_PER_REQUEST) {
            const response = await viewUserInfoForLotteryId(
                  account,
                  lotteryId,
                  cursor,
                  TICKET_LIMIT_PER_REQUEST,
                  provider,
            );
            cursor += TICKET_LIMIT_PER_REQUEST;
            numReturned = response.length;
            ticketData.push(...response);
      }
      const winningTickets = await getWinningTickets({
            roundId: lotteryId,
            userTickets: ticketData,
            finalNumber,
            provider,
      });
      return {
            cakeTotal: winningTickets?.cakeTotal,
            winningTickets: winningTickets?.allWinningTickets,
      };
};

const getRewardBracketByNumber = (ticketNumber: string, finalNumber: string): number => {
      const ticketNumAsArray = ticketNumber.split("").reverse();
      const winningNumsAsArray = finalNumber.split("").reverse();
      const matchingNumbers = [] as string[];

      for (let index = 0; index < winningNumsAsArray.length - 1; index++) {
            if (ticketNumAsArray[index] !== winningNumsAsArray[index]) break;
            matchingNumbers.push(ticketNumAsArray[index]);
      }
      const rewardBracket = matchingNumbers.length - 1;
      return rewardBracket;
};

export const getWinningTickets = async (roundDataAndUserTickets: {
      roundId: string;
      userTickets: any[];
      finalNumber: string;
      provider: PublicClient;
}): Promise<GetWinningTicketsResult> => {
      const { roundId, userTickets, finalNumber, provider } = roundDataAndUserTickets;
      const ticketsWithRewardBrackets = userTickets.map((ticket) => {
            return {
                  roundId,
                  id: ticket.id,
                  number: ticket.number,
                  status: ticket.status,
                  rewardBracket: getRewardBracketByNumber(ticket.number, finalNumber),
            };
      });

      const allWinningTickets = ticketsWithRewardBrackets.filter((ticket) => {
            return ticket.rewardBracket >= 0;
      });
      const unclaimedWinningTickets = allWinningTickets.filter((ticket) => {
            return !ticket.status;
      });

      if (unclaimedWinningTickets.length > 0) {
            const { cakeTotal } = await fetchCakeRewardsForTickets(unclaimedWinningTickets, provider);
            return { allWinningTickets, cakeTotal, roundId };
      }

      if (allWinningTickets.length > 0) {
            return { allWinningTickets, cakeTotal: null, roundId };
      }

      return {} as GetWinningTicketsResult;
};

export const getLotteryPrizeInCake = async (
      lotteryId: string,
      provider: PublicClient,
): Promise<{ totalPrizeInUsd: number; prizeAmountInCake: number }> => {
      try {
            const data = await provider.readContract({
                  abi: lotteryV2ABI,
                  address: LOTTERY_CONTRACT_ADDRESS,
                  functionName: "viewLottery",
                  args: [BigInt(lotteryId)],
            });
            const prizeAmountInCake = Number(
                  Number(formatUnits(data.amountCollectedInCake, 18)).toFixed(2),
            );
            const cakePrice = GlobalTaskScheduler.cakePrice;
            const totalPrizeInUsd = Number(cakePrice) * prizeAmountInCake;

            return { totalPrizeInUsd, prizeAmountInCake };
      } catch (error) {
            console.error("viewUserInfoForLotteryId", error);
            return { totalPrizeInUsd: 0, prizeAmountInCake: 0 };
      }
};

const fetchCakeRewardsForTickets = async (winningTickets: LotteryTicket[], provider: PublicClient) => {
      const calls = winningTickets.map((winningTicket) => {
            const { roundId, id, rewardBracket } = winningTicket;
            return {
                  abi: lotteryV2ABI,
                  functionName: "viewRewardsForTicketId",
                  address: LOTTERY_CONTRACT_ADDRESS,
                  args: [BigInt(roundId as string), BigInt(id), rewardBracket],
            } as const;
      });

      try {
            const cakeRewards = (await provider.multicall({
                  contracts: calls,
                  allowFailure: false,
            })) as any;

            const cakeTotal = cakeRewards.reduce((accum: BigNumber, cakeReward: bigint) => {
                  return accum.plus(new BigNumber(cakeReward.toString()));
            }, new BigNumber(0));

            const ticketsWithUnclaimedRewards = winningTickets.map((winningTicket, index) => {
                  return {
                        ...winningTicket,
                        cakeReward: cakeRewards[index].toString(),
                  };
            });
            return { ticketsWithUnclaimedRewards, cakeTotal };
      } catch (error) {
            console.error(error);
            return { ticketsWithUnclaimedRewards: null, cakeTotal: null };
      }
};

// const main = async () => {
//   const provider = getViemClient({ chainId: ChainId.BSC });

//   const r = await getLotteryPrizeInCake("1090", provider);
// };

// main();
