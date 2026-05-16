export type BudgetBarTone = 'green' | 'yellow' | 'red';

const YELLOW_THRESHOLD = 0.8;
const RED_THRESHOLD = 1;

export const resolveBudgetBarTone = (ratio: number): BudgetBarTone => {
    if (ratio >= RED_THRESHOLD) {
        return 'red';
    }

    if (ratio >= YELLOW_THRESHOLD) {
        return 'yellow';
    }

    return 'green';
};
