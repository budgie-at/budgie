import { isPositiveNumber } from '@rnw-community/shared';

export const isDebtDeadlineUrgent = (createdAt: Date, deadline: Date): boolean => {
    const totalMs = deadline.getTime() - createdAt.getTime();
    const remainingMs = deadline.getTime() - Date.now();

    if (!isPositiveNumber(totalMs)) {
        return false;
    }

    return remainingMs <= totalMs * 0.3;
};
