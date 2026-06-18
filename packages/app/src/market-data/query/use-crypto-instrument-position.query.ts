import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionEntryPositionRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

import type { CryptoPositionEntryRowInterface } from '@budgie/contracts';

const consumeLots = (lots: { amount: number; baseAmount: number | null }[], amount: number): void => {
    let remainingAmount = amount;

    while (isPositiveNumber(remainingAmount)) {
        const [lot] = lots;

        if (!isDefined(lot) || !isPositiveNumber(lot.amount)) {
            return;
        }

        const consumedAmount = Math.min(lot.amount, remainingAmount);

        if (isDefined(lot.baseAmount)) {
            lot.baseAmount = isPositiveNumber(lot.amount - consumedAmount)
                ? (lot.baseAmount * (lot.amount - consumedAmount)) / lot.amount
                : 0;
        }

        lot.amount -= consumedAmount;
        remainingAmount -= consumedAmount;

        if (!isPositiveNumber(lot.amount)) {
            lots.shift();
        }
    }
};

const calculatePosition = (entries: CryptoPositionEntryRowInterface[]) => {
    const lots: { amount: number; baseAmount: number | null }[] = [];

    entries.forEach(entry => {
        if (entry.type === TransactionEntryTypeEnum.DEBIT) {
            lots.push({ amount: entry.amount, baseAmount: entry.baseAmount });

            return;
        }

        consumeLots(lots, entry.amount);
    });

    const amountMicro = lots.reduce((total, lot) => total + lot.amount, 0);
    const hasUnknownCost = lots.some(lot => !isDefined(lot.baseAmount));
    const costBasisMicro = hasUnknownCost ? null : lots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0);
    const costBasis = isDefined(costBasisMicro) ? convertFromMicroUnits(costBasisMicro) : null;
    const averageCost = isDefined(costBasisMicro) && isPositiveNumber(amountMicro) ? costBasisMicro / amountMicro : null;

    return {
        costBasis,
        averageCost
    };
};

export const useCryptoInstrumentPositionQuery = (instrumentId: number, baseInstrumentId: number) => {
    const dependencies = [instrumentId, baseInstrumentId];
    const { data } = useLiveQuery(
        transactionEntryPositionRepository.findCryptoPositionEntries(instrumentId, baseInstrumentId),
        dependencies
    );

    return calculatePosition(data);
};
