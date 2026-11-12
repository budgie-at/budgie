import { TransactionEntryTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import type { InstrumentPositionLotInterface } from '../interface/instrument-position-lot.interface';
import type { InstrumentPositionInterface } from '../interface/instrument-position.interface';
import type { InstrumentPositionEntryRowInterface } from '@budgie/contracts';

const consumeLots = (allLots: readonly InstrumentPositionLotInterface[], amount: number): readonly InstrumentPositionLotInterface[] => {
    const lots = allLots.filter(lot => isPositiveNumber(lot.amount));
    let remainingAmount = amount;
    for (let consumedLotCount = 0; consumedLotCount < lots.length; consumedLotCount += 1) {
        const lot = lots.at(consumedLotCount);

        if (!isDefined(lot) || !isPositiveNumber(remainingAmount)) {
            return lots.slice(consumedLotCount);
        }

        if (lot.amount > remainingAmount) {
            const remainingLotAmount = lot.amount - remainingAmount;
            const remainingBaseAmount = isDefined(lot.baseAmount) ? (lot.baseAmount * remainingLotAmount) / lot.amount : null;

            return [{ amount: remainingLotAmount, baseAmount: remainingBaseAmount }, ...lots.slice(consumedLotCount + 1)];
        }

        remainingAmount -= lot.amount;
    }

    return [];
};

export const calculateInstrumentPosition = (entries: readonly InstrumentPositionEntryRowInterface[]): InstrumentPositionInterface => {
    let lots: readonly InstrumentPositionLotInterface[] = [];
    let realizedProfitLossMicro = 0;
    for (const entry of entries) {
        if (entry.type === TransactionEntryTypeEnum.DEBIT) {
            lots = lots.concat({
                amount: entry.amount,
                baseAmount: isDefined(entry.baseAmount) ? entry.baseAmount + (entry.feeBaseAmount ?? 0) : null
            });
        } else {
            const remainingLots = consumeLots(lots, entry.amount);
            const hasKnownCost = lots.every(lot => isDefined(lot.baseAmount));
            if (
                entry.type === TransactionEntryTypeEnum.CREDIT &&
                entry.isAdjustment !== true &&
                entry.isInstrumentTransfer !== true &&
                isDefined(entry.baseAmount) &&
                hasKnownCost
            ) {
                realizedProfitLossMicro +=
                    entry.baseAmount -
                    (entry.feeBaseAmount ?? 0) -
                    lots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0) +
                    remainingLots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0);
            }
            const remainingAmount = remainingLots.reduce((total, lot) => total + lot.amount, 0);
            const consumedCost =
                lots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0) -
                remainingLots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0);
            lots =
                entry.isAdjustment === true
                    ? remainingLots.map(lot => ({
                          amount: lot.amount,
                          baseAmount: hasKnownCost ? (lot.baseAmount ?? 0) + (consumedCost * lot.amount) / remainingAmount : null
                      }))
                    : remainingLots;
        }
    }
    lots = lots.filter(lot => isDefined(lot.baseAmount) && isPositiveNumber(lot.amount));
    const amountMicro = lots.reduce((total, lot) => total + lot.amount, 0);
    const costBasisMicro = isNotEmptyArray(lots) ? lots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0) : null;

    return {
        amount: convertFromMicroUnits(amountMicro),
        realizedProfitLoss: convertFromMicroUnits(realizedProfitLossMicro),
        costBasis: isDefined(costBasisMicro) ? convertFromMicroUnits(costBasisMicro) : null,
        averageCost: isDefined(costBasisMicro) && isPositiveNumber(amountMicro) ? costBasisMicro / amountMicro : null
    };
};
