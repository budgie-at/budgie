import { TransactionEntryTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { CryptoPositionLotInterface } from '../interface/crypto-position-lot.interface';
import type { CryptoPositionInterface } from '../interface/crypto-position.interface';
import type { CryptoPositionEntryRowInterface } from '@budgie/contracts';

const consumeLots = (allLots: readonly CryptoPositionLotInterface[], amount: number): readonly CryptoPositionLotInterface[] => {
    const lots = allLots.filter(lot => isPositiveNumber(lot.amount));
    let remainingAmount = amount;
    let consumedLotCount = 0;

    while (isPositiveNumber(remainingAmount)) {
        const lot = lots.at(consumedLotCount);

        if (!isDefined(lot)) {
            break;
        }

        if (lot.amount > remainingAmount) {
            const remainingLotAmount = lot.amount - remainingAmount;
            const remainingBaseAmount = isDefined(lot.baseAmount) ? (lot.baseAmount * remainingLotAmount) / lot.amount : null;

            return [{ amount: remainingLotAmount, baseAmount: remainingBaseAmount }, ...lots.slice(consumedLotCount + 1)];
        }

        remainingAmount -= lot.amount;
        consumedLotCount += 1;
    }

    return lots.slice(consumedLotCount);
};

export const calculateCryptoPosition = (entries: readonly CryptoPositionEntryRowInterface[]): CryptoPositionInterface => {
    const lots = entries.reduce<readonly CryptoPositionLotInterface[]>(
        (openLots, entry) =>
            entry.type === TransactionEntryTypeEnum.DEBIT
                ? openLots.concat({ amount: entry.amount, baseAmount: entry.baseAmount })
                : consumeLots(openLots, entry.amount),
        []
    );
    const amountMicro = lots.reduce((total, lot) => total + lot.amount, 0);
    const hasUnknownCost = lots.some(lot => !isDefined(lot.baseAmount));
    const costBasisMicro = hasUnknownCost ? null : lots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0);

    return {
        costBasis: isDefined(costBasisMicro) ? convertFromMicroUnits(costBasisMicro) : null,
        averageCost: isDefined(costBasisMicro) && isPositiveNumber(amountMicro) ? costBasisMicro / amountMicro : null
    };
};
