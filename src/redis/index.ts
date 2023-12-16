import { ChainId } from "@pancakeswap/chains";
import Redis from "ioredis";
import { Logger } from "winston";
import { AppLogger } from "../logging/logger";
import appConfig from "../config/config";

export class RedisClient extends AppLogger {
      public client: Redis;
      public staticClient: RedisClient;
      public log: Logger;

      constructor(redisUrl: string) {
            super();
            this.log = this.getLogger("redis-client");
            this.client = new Redis(redisUrl as any);
            this.setUpListeners(this.client);
            this.staticClient = this;
      }

      private setUpListeners(client: Redis) {
            client.on("error", (err) => this.log.info(`Redis Client Error. Error: ${err}`));
            client.on("connect", () => this.log.info("Redis Client is connect"));
            client.on("reconnecting", () => this.log.info("Redis Client is reconnecting"));
            client.on("ready", () => this.log.info("Redis Client is ready"));
      }

      public async initializeFallback(redisUrl: string): Promise<void> {
            this.client = new Redis(redisUrl as any);
            this.setUpListeners(this.client);
      }

      public async duplicateWithExpireCallback(
            redisUrl: string,
            expireCallback: (key: string) => void,
      ): Promise<void> {
            const sub = this.client.duplicate();
            await sub.subscribe("__keyevent@0__:expired");

            sub.on("message", async (key) => {
                  expireCallback(key as string);
            });

            this.client = new Redis(redisUrl as any);
            this.setUpListeners(this.client);
      }

      // keys
      getUserTimestampKey = (networkId: number, job: string, user: string) =>
            `timestamp-${job}-${networkId}-${user}`;

      getUserTimestampKeys = (networkId: number, job: string, users: string[]) => {
            return users.map((user) => `timestamp-${job}-${networkId}-${user}`);
      };

      getBalanceKeys = (users: string[], networkId: number): string[] => {
            return users.map((user) => `balance-${networkId}-${user}`);
      };

      getFarmCacheKeys = (farmIds: number[], network: ChainId) => {
            return {
                  aprKeys: farmIds.map((id: number) => `farm-apr-${network}-${id}`),
                  timestamps: farmIds.map((id: number) => `farm-timestamp-${network}-${id}`),
            };
      };

      // get data methods
      async getSingleData<T>(key: string, notFoundValue: T | null = null): Promise<T | null> {
            const res = await this.client.get(key); // multiple-prices
            if (res) {
                  return JSON.parse(res);
            }
            return notFoundValue;
      }

      async getMultipleData<T>({
            keys,
            pattern,
            notFoundValue,
      }: {
            keys?: string[] | undefined;
            pattern?: string | undefined;
            notFoundValue?: T | null;
      }): Promise<T[] | null> {
            const redisKeys = pattern ? await this.client.keys(pattern) : keys;
            if (redisKeys.length === 0) return [];

            const data = await this.client.mget(...redisKeys);
            const parsedData = data.map((item) =>
                  item && item !== "NaN" ? JSON.parse(item) : notFoundValue,
            ) as T[];
            return parsedData;
      }

      async setSignleData<T>(key: string, data: T): Promise<void> {
            await this.client.set(key, JSON.stringify(data));
      }

      // set data methods
      async setSignleDataWithExpiration<T>(key: string, data: T, timeoutMS?: number) {
            if (timeoutMS === undefined) {
                  timeoutMS = 1000 * 60 * 60 * 24 * 3;
            }
            await this.client.set(key, JSON.stringify(data), "PX", timeoutMS);
      }

      public async setMultipleData(userKeys: string[], data: any): Promise<void> {
            const pipeline = this.client.multi();
            userKeys.forEach((key, i) => {
                  pipeline.set(key, JSON.stringify(data[i]));
            });

            pipeline.exec((error) => {
                  if (error) {
                        console.error("Error:", error);
                  }
            });
      }

      public async setMultipleHashFields(key: string, fields: Record<string, string>): Promise<void> {
            await this.client.hmset(key, fields);
      }

      public async getMultipleHashFields(key: string): Promise<string[]> {
            const fields = await redisClient.client.hmget(key);
            return fields;
      }

      async setMultipleDataWithExpiration(keys: string[], data: any, timeoutMS?: number): Promise<void> {
            if (timeoutMS === undefined) {
                  timeoutMS = 1000 * 60 * 60 * 24 * 5;
            }

            const pipeline = this.client.pipeline();

            keys.forEach((key) => pipeline.set(key, JSON.stringify(data), "PX", timeoutMS));

            await pipeline.exec();
      }

      // exits data methods
      async existSingleData(key: string): Promise<boolean> {
            return (await this.client.exists(key)) > 0;
      }

      async existMultipleData({
            keys,
            pattern,
      }: {
            keys?: string[] | undefined;
            pattern?: string | undefined;
      }): Promise<boolean[]> {
            const redisKeys = pattern ? await this.client.keys(pattern) : keys;
            if (redisKeys.length === 0) return [];

            const pipeline = this.client.pipeline();
            redisKeys.forEach((key) => pipeline.exists(key));

            const results = await pipeline.exec();

            return results.map(([_, result]: any[]) => result > 0);
      }
}

export const redisClient = new RedisClient(appConfig.redisUrl);
