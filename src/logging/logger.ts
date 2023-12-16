import { createLogger, format, Logger, transports } from "winston";
import * as Transport from "winston-transport";
import appConfig from "../config/config";

export class AppLogger {
      private logger: Logger;

      constructor() {
            this.initLogger();
      }

      private initLogger() {
            if (!this.logger) {
                  let customFormat = format.json();
                  const transportsConfig: Transport[] = [new transports.Console()];

                  const httpTransportOptions = {
                        host: "http-intake.logs.us3.datadoghq.com",
                        path: `/api/v2/logs?dd-api-key=${appConfig.dataDogApiKey}&ddsource=nodejs&service=${appConfig.applicationName}`,
                        ssl: true,
                  };

                  if (appConfig.env !== "production") {
                        customFormat = format.combine(format.timestamp(), this.customPrintf());
                  } else {
                        transportsConfig.push(new transports.Http(httpTransportOptions));
                  }

                  this.logger = createLogger({
                        format: customFormat,
                        transports: transportsConfig,
                        level: "debug",
                  });
            }
      }

      private customPrintf() {
            return format.printf(({ level, message, label, timestamp }) => {
                  return `${timestamp} | ${level.toLowerCase().padEnd(5)} | ${label.padEnd(
                        20,
                  )} | ${message}`;
            });
      }

      getLogger(label: string) {
            if (label.length > 30) {
                  throw new Error("Too long label");
            }
            return this.logger.child({ label });
      }
}
