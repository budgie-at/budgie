export const parseErsteAmount = (amountString: string, isDebit: boolean): number => {
    const cleanAmount = amountString.replace(/\./gu, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);

    return isDebit ? -Math.abs(amount) : Math.abs(amount);
};
