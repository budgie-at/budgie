interface WithAmount {
    readonly amount: number;
}

export const sumAmounts = (items: WithAmount[]): number => items.reduce((sum, item) => sum + item.amount, 0);
