import { config } from "dotenv";
import * as z from "zod";

config();

const envsSchema = z
      .object({
            NODE_ENV: z.enum(["production", "development", "test"]),
            REDIS_TSL: z.string().optional(),
            REDIS_URL: z.string().optional(),
            DATADOG_API_KEY: z.string().nonempty(),
            APPLICATION_NAME: z.string().nonempty(),
            WALLET_CONNECT_SECRET_KEY: z
                  .string({
                        required_error: "Wallet connect secret required for url signing",
                  })
                  .nonempty(),
            WALLET_CONNECT_API_KEY: z
                  .string({
                        required_error: "Wallet connect api key required for url signing",
                  })
                  .nonempty(),
            SECURE_TOKEN: z
                  .string({
                        required_error: "secure token required for url signing",
                  })
                  .nonempty(),
            NATIVE_BALANCE_SCHEDULE: z
                  .string({
                        required_error: "native balance schedule required",
                  })
                  .nonempty(),
            TOKEN_PRICE_SCHEDULE: z
                  .string({ required_error: "token price schedule required" })
                  .nonempty(),
            FARM_APR_SCHEDULE: z
                  .string({ required_error: "farm apr schedule required" })
                  .nonempty(),
            LOTTERY_UPDATE_SCHEDULE: z
                  .string({
                        required_error: "lottery update schedule required",
                  })
                  .nonempty(),
            LOTTERY_RESULT_SCHEDULE: z
                  .string({
                        required_error: "lottery result schedule required",
                  })
                  .nonempty(),
            PREDICTION_WINNER_SCHEDULE: z
                  .string({
                        required_error: "prediction winner schedule required",
                  })
                  .nonempty(),
            PREDICTION_UPDATE_SCHEDULE: z
                  .string({
                        required_error: "prediction update schedule required",
                  })
                  .nonempty(),
            UPDATE_PRICES_SCHEDULE: z
                  .string({ required_error: "update prices schedule required" })
                  .nonempty(),
            UPDATE_SUBSCRIBERS_SCHEDULE: z
                  .string({
                        required_error: "update subscribers schedule required",
                  })
                  .nonempty(),
            WHITELIST_FARMS_SCHEDULE: z
                  .string({
                        required_error: "whitelist farms schedule required",
                  })
                  .nonempty(),
            POSITION_NOIFY_SCHEDULE: z
                  .string({
                        required_error: "position notify schedule required",
                  })
                  .nonempty(),
            TRADING_REWARD_UPDATE_SCHEDULE: z
                  .string({
                        required_error: "trading reward schedule required",
                  })
                  .nonempty(),
            TRADING_REWARD_CHECK_SCHEDULE: z
                  .string({
                        required_error: "trading reward check schedule required",
                  })
                  .nonempty(),
      })
      .nonstrict();

const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      REDIS_TSL: process.env.REDIS_TSL,
      REDIS_URL: process.env.REDIS_URL,
      DATADOG_API_KEY: process.env.DATADOG_API_KEY,
      APPLICATION_NAME: process.env.APPLICATION_NAME,
      LOG_LOCAL_FORMAT: process.env.LOG_LOCAL_FORMAT === "true" ? true : null,
      WALLET_CONNECT_SECRET_KEY: process.env.WALLET_CONNECT_SECRET_KEY ?? "",
      WALLET_CONNECT_API_KEY: process.env.WALLET_CONNECT_API_KEY,
      SECURE_TOKEN: process.env.SECURE_TOKEN,
      NATIVE_BALANCE_SCHEDULE: process.env.NATIVE_BALANCE_SCHEDULE ?? "",
      TOKEN_PRICE_SCHEDULE: process.env.TOKEN_PRICE_SCHEDULE ?? "",
      FARM_APR_SCHEDULE: process.env.FARM_APR_SCHEDULE ?? "",
      LOTTERY_UPDATE_SCHEDULE: process.env.LOTTERY_UPDATE_SCHEDULE ?? "",
      LOTTERY_RESULT_SCHEDULE: process.env.LOTTERY_RESULT_SCHEDULE ?? "",
      PREDICTION_WINNER_SCHEDULE: process.env.PREDICTION_WINNER_SCHEDULE ?? "",
      PREDICTION_UPDATE_SCHEDULE: process.env.PREDICTION_UPDATE_SCHEDULE ?? "",
      UPDATE_PRICES_SCHEDULE: process.env.UPDATE_PRICES_SCHEDULE ?? "",
      UPDATE_SUBSCRIBERS_SCHEDULE: process.env.UPDATE_SUBSCRIBERS_SCHEDULE ?? "",
      WHITELIST_FARMS_SCHEDULE: process.env.WHITELIST_FARMS_SCHEDULE ?? "",
      POSITION_NOIFY_SCHEDULE: process.env.POSITION_NOIFY_SCHEDULE ?? "",
      TRADING_REWARD_UPDATE_SCHEDULE: process.env.TRADING_REWARD_UPDATE_SCHEDULE ?? "",
      TRADING_REWARD_CHECK_SCHEDULE: process.env.TRADING_REWARD_CHECK_SCHEDULE ?? "",
};

try {
      const validatedEnvs = envsSchema.parse(envVars);
      console.log(validatedEnvs);
} catch (error) {
      console.error("Error validating environment variables:", error);
}

// Define the type for the exported object
type EnvConfig = {
      env: string | undefined;
      redisUrl: string | undefined;
      dataDogApiKey: string | undefined;
      applicationName: string | undefined;
      walletConnectSecretKey: string;
      walletConnectApiKey: string | undefined;
      secureToken: string | undefined;
      redisTsl: string | undefined;
      nativeBalanceSchedule: string;
      tokenPricesSchedule: string;
      farmAprSchedule: string;
      lotteryuUpdateSchedule: string;
      lotteryResultSchedule: string;
      predictionWinnerSchedule: string;
      predictionUpdateSchedule: string;
      multiplePricesSchedule: string;
      subscribersSchedule: string;
      whitelistFarmsSchedule: string;
      positionNotifySchedule: string;
      tradingRewardSchedule: string;
      tradingRewardCheckSchedule: string;
};

// map env vars and make it visible outside module
const appConfig: EnvConfig = {
      env: envVars.NODE_ENV,
      redisUrl: envVars.REDIS_URL,
      dataDogApiKey: envVars.DATADOG_API_KEY,
      applicationName: envVars.APPLICATION_NAME,
      walletConnectSecretKey: envVars.WALLET_CONNECT_SECRET_KEY,
      walletConnectApiKey: envVars.WALLET_CONNECT_API_KEY,
      secureToken: envVars.SECURE_TOKEN,
      redisTsl: envVars.REDIS_TSL,
      nativeBalanceSchedule: envVars.NATIVE_BALANCE_SCHEDULE,
      tokenPricesSchedule: envVars.TOKEN_PRICE_SCHEDULE,
      farmAprSchedule: envVars.FARM_APR_SCHEDULE,
      lotteryuUpdateSchedule: envVars.LOTTERY_UPDATE_SCHEDULE,
      lotteryResultSchedule: envVars.LOTTERY_RESULT_SCHEDULE,
      predictionWinnerSchedule: envVars.PREDICTION_WINNER_SCHEDULE,
      predictionUpdateSchedule: envVars.PREDICTION_UPDATE_SCHEDULE,
      multiplePricesSchedule: envVars.UPDATE_PRICES_SCHEDULE,
      subscribersSchedule: envVars.UPDATE_SUBSCRIBERS_SCHEDULE,
      whitelistFarmsSchedule: envVars.WHITELIST_FARMS_SCHEDULE,
      positionNotifySchedule: envVars.POSITION_NOIFY_SCHEDULE,
      tradingRewardSchedule: envVars.TRADING_REWARD_UPDATE_SCHEDULE,
      tradingRewardCheckSchedule: envVars.TRADING_REWARD_CHECK_SCHEDULE,
};

export default appConfig;
