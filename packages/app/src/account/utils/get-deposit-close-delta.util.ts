const CENTS = 100;

export const getDepositCloseDelta = (amountReceived: number, ledgerBalance: number) =>
    Math.round(amountReceived * CENTS - ledgerBalance * CENTS) / CENTS + 0;
