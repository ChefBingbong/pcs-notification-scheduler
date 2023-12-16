import { Address } from "viem";
import { BuilderNames, NotificationPayload } from "./types";
import { PancakeNotifications } from "./payloadBuiler";
import axios from "axios";
import appConfig from "../config/config";

export const sendPushNotification = async (
      notificationType: BuilderNames,
      args: Array<any>,
      users: Address[],
) => {
      const notificationPayload = PancakeNotifications[notificationType](args);

      try {
            const notifyResponse = await axios.post(
                  `https://notify.walletconnect.com/${appConfig.walletConnectApiKey}/notify`,
                  notificationPayload, // Pass the payload directly as data
                  {
                        headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${appConfig.walletConnectSecretKey}`,
                        },
                  },
            );
            if (notifyResponse?.data?.sent.length > 0) {
                  console.log(notifyResponse.data);
                  await sendBrowserNotification(
                        "PancakeSwap Alert",
                        "You have new updates from PancakeSwap DEX.",
                        users,
                  );
            }
      } catch (error) {
            // @ts-ignore
            console.error("send notification error", error.response.data);
      }
};

export const sendPushNotificationWithPayload = async (
      notificationPayload: NotificationPayload,
      users: Address[],
) => {
      try {
            const notifyResponse = await axios.post(
                  `https://notify.walletconnect.com/${appConfig.walletConnectApiKey}/notify`,
                  notificationPayload, // Pass the payload directly as data
                  {
                        headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${appConfig.walletConnectSecretKey}`,
                        },
                  },
            );
            console.log(notifyResponse.data);
            if (notifyResponse?.data?.sent.length > 0) {
                  await sendBrowserNotification(
                        "PancakeSwap Alert",
                        "You have new updates from PancakeSwap DEX.",
                        users,
                  );
            }
            return notifyResponse?.data;
      } catch (error) {
            // @ts-ignore
            console.error("send notification error", error.response.data);
            return error.response.data;
      }
};

export async function sendBrowserNotification(title: string, body: string, users: string[]) {
      try {
            await fetch("https://notification-hub.pancakeswap.com/broadcast-notifications", {
                  method: "POST",
                  body: JSON.stringify({
                        notification: { title, body },
                        users,
                  }),
                  headers: {
                        "Content-Type": "application/json",
                        "x-secure-token": appConfig.secureToken as string,
                  },
            });
      } catch (error: any) {
            console.error("Failed to send browser notification", error.message);
      }
}
