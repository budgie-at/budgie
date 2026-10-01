import { type Duration, intervalToDuration } from 'date-fns';

export const getDebtDeadlineRemaining = (deadline: Date): Duration | null => {
    const now = Date.now();

    if (deadline.getTime() < now) {
        return null;
    }

    return intervalToDuration({ start: now, end: deadline });
};
