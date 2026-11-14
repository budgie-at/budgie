const CENTS = 100;

export const getDepositCloseDelta = (amountReceived: number, ledgerBalance: number) => {
    const deltaInCents = Math.round(amountReceived * CENTS - ledgerBalance * CENTS);

    return deltaInCents === 0 ? 0 : deltaInCents / CENTS;
};
