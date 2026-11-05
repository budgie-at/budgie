import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';

export const sumTransactionAmounts = (...amounts: readonly number[]): number =>
    convertFromMicroUnits(amounts.reduce((total, amount) => total + convertToMicroUnits(amount), 0));
