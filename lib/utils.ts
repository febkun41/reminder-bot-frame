export const isValidDuration = (durationStr: string): boolean => {
    // Regular expression to validate time components
    const pattern = /^(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?$/;
    const match = durationStr.trim().match(pattern);

    if (!match) {
        return false;
    }

    // match[0] is the full match, match[1-3] are the captured groups
    const [, days, hours, minutes] = match;

    // Convert strings to numbers, using 0 if undefined
    const daysNum = days ? parseInt(
        days) : 0;
    const hoursNum = hours ? parseInt(hours) : 0;
    const minutesNum = minutes ? parseInt(minutes) : 0;

    // Ensure at least one value is provided
    return !(daysNum === 0 && hoursNum === 0 && minutesNum === 0);
};

export const parseDurationToTimestamp = (durationStr: string): number => {
    // if (!isValidDuration(durationStr)) {
    //     throw new Error("Invalid duration format. Use format like '1d 12h 25m', '3h 30m', or '45m'");
    // }

    // Regular expression to capture time components
    const pattern = /^(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?$/;
    const match = durationStr.trim().match(pattern);
    const [, days, hours, minutes] = match!;

    // Convert strings to numbers, using 0 if undefined
    const daysNum = days ? parseInt(days) : 0;
    const hoursNum = hours ? parseInt(hours) : 0;
    const minutesNum = minutes ? parseInt(minutes) : 0;

    // Calculate milliseconds
    const millisecondsToAdd =
        daysNum * 24 * 60 * 60 * 1000 +
        hoursNum * 60 * 60 * 1000 +
        minutesNum * 60 * 1000;

    // Get future timestamp
    const futureTimestamp = Date.now() + millisecondsToAdd;

    // Return Unix timestamp in seconds
    return Math.floor(futureTimestamp / 1000);
};