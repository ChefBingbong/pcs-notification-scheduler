import dayjs from "dayjs";

const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = 3600;
export const TWO_HOURS = 1000 * 60 * 60 * 2;
export const ONE_DAY = 1000 * 60 * 60 * 24;

const DAY_IN_SECONDS = 86400;
const MONTH_IN_SECONDS = 2629800;
const YEAR_IN_SECONDS = 31557600;

export const getTimePeriods = (seconds: number) => {
      let delta = Math.abs(seconds);
      const timeLeft = {
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalDays: 0,
      };

      if (delta >= DAY_IN_SECONDS) {
            timeLeft.totalDays = Math.floor(delta / DAY_IN_SECONDS);
      }

      if (delta >= YEAR_IN_SECONDS) {
            timeLeft.years = Math.floor(delta / YEAR_IN_SECONDS);
            delta -= timeLeft.years * YEAR_IN_SECONDS;
      }

      if (delta >= MONTH_IN_SECONDS) {
            timeLeft.months = Math.floor(delta / MONTH_IN_SECONDS);
            delta -= timeLeft.months * MONTH_IN_SECONDS;
      }

      if (delta >= DAY_IN_SECONDS) {
            timeLeft.days = Math.floor(delta / DAY_IN_SECONDS);
            delta -= timeLeft.days * DAY_IN_SECONDS;
      }

      if (delta >= HOUR_IN_SECONDS) {
            timeLeft.hours = Math.floor(delta / HOUR_IN_SECONDS);
            delta -= timeLeft.hours * HOUR_IN_SECONDS;
      }

      if (delta >= MINUTE_IN_SECONDS) {
            timeLeft.minutes = Math.floor(delta / MINUTE_IN_SECONDS);
            delta -= timeLeft.minutes * MINUTE_IN_SECONDS;
      }

      timeLeft.seconds = delta;

      return timeLeft;
};

export const timeElapsed = (unix: string, buffer?: number) => {
      const now = dayjs();
      const timestamp = dayjs.unix(parseInt(unix)).add(buffer ?? 0);

      const inSeconds = now.diff(timestamp, "second");
      const inMinutes = now.diff(timestamp, "minute");
      const inHours = now.diff(timestamp, "hour");
      const inDays = now.diff(timestamp, "day");

      return { inSeconds, inMinutes, inHours, inDays };
};

export const getFormattedTime = (startTime: number) => {
      const currentTimestamp = Math.floor(new Date().getTime() / 1000);
      const { hours, minutes } = getTimePeriods(startTime - currentTimestamp);
      const formattedTimeString = `${hours} hours and ${minutes} minutes`;
      return formattedTimeString;
};
