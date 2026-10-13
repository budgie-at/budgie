export const parseErsteAmount = (amountString: string, isDebit: boolean): number => {
    const cleanAmount = amountString.replaceAll('.', '').replace(',', '.');
    const amount = Number.parseFloat(cleanAmount);

    if (Number.isNaN(amount)) {
        return 0;
    }

    return isDebit ? -Math.abs(amount) : Math.abs(amount);
};
