interface Duration {
  days: number;
  hours: number;
  minutes: number;
}

const DURATION_PATTERN = /^(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?$/;

const parseDuration = (durationStr: string): Duration | null => {
  const match = durationStr.trim().match(DURATION_PATTERN);
  if (!match) return null;

  const [, days, hours, minutes] = match;
  return {
    days: days ? parseInt(days) : 0,
    hours: hours ? parseInt(hours) : 0,
    minutes: minutes ? parseInt(minutes) : 0
  };
};

export const isValidDuration = (durationStr: string): boolean => {
  const duration = parseDuration(durationStr);
  if (!duration) return false;
  
  const { days, hours, minutes } = duration;
  return days > 0 || hours > 0 || minutes > 0;
};

export const parseDurationToTimestamp = (durationStr: string): number => {
  const duration = parseDuration(durationStr);
  if (!duration) throw new Error('Invalid duration format');

  const { days, hours, minutes } = duration;
  const millisecondsToAdd =
    days * 24 * 60 * 60 * 1000 +
    hours * 60 * 60 * 1000 +
    minutes * 60 * 1000;

  return Math.floor((Date.now() + millisecondsToAdd) / 1000);
};