import { isPositiveNumber } from '@rnw-community/shared';

export const getDeadlinePriority = (createdAt: Date, deadline: Date): 'high' | 'normal' => {
    const totalMs = deadline.getTime() - createdAt.getTime();
    const remainingMs = deadline.getTime() - Date.now();

    if (!isPositiveNumber(totalMs)) {
        return 'normal';
    }

    return remainingMs <= totalMs * 0.3 ? 'high' : 'normal';
};
