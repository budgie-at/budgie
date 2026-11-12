import { TransactionEntryTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import type { InstrumentPositionLotInterface } from '../interface/instrument-position-lot.interface';
import type { InstrumentPositionInterface } from '../interface/instrument-position.interface';
import type { InstrumentPositionEntryRowInterface } from '@budgie/contracts';

const consumeLots = (lots: readonly InstrumentPositionLotInterface[], amount: number) => {
    const consumed: InstrumentPositionLotInterface[] = [];
    const remaining: InstrumentPositionLotInterface[] = [];
    let remainingAmount = amount;
    for (const lot of lots) {
        const consumedAmount = Math.min(lot.amount, Math.max(0, remainingAmount));
        const consumedCost = isDefined(lot.baseAmount) ? (lot.baseAmount * consumedAmount) / lot.amount : null;
        if (isPositiveNumber(consumedAmount)) {
            consumed.push({ amount: consumedAmount, baseAmount: consumedCost });
        }
        if (lot.amount > consumedAmount) {
            remaining.push({
                amount: lot.amount - consumedAmount,
                baseAmount: isDefined(lot.baseAmount) ? lot.baseAmount - (consumedCost ?? 0) : null
            });
        }
        remainingAmount -= consumedAmount;
    }

    return { consumed, remaining };
};

export const calculateInstrumentPosition = (
    entries: readonly InstrumentPositionEntryRowInterface[],
    accountIds?: readonly number[]
): InstrumentPositionInterface => {
    const accountLots = new Map<number, readonly InstrumentPositionLotInterface[]>();
    let realizedProfitLossMicro = 0;
    for (const entry of entries) {
        const accountId = entry.accountId ?? 0;
        const lots = accountLots.get(accountId) ?? [];
        if (isDefined(entry.transferAccountId)) {
            if (entry.type === TransactionEntryTypeEnum.CREDIT) {
                const { consumed, remaining } = consumeLots(lots, entry.amount);
                accountLots.set(accountId, remaining);
                accountLots.set(entry.transferAccountId, (accountLots.get(entry.transferAccountId) ?? []).concat(consumed));
            }
        } else if (entry.isAdjustment === true && isDefined(entry.baseAmount)) {
            const quantity = lots.reduce((total, lot) => total + lot.amount, 0);
            const nextQuantity = quantity + (entry.type === TransactionEntryTypeEnum.DEBIT ? entry.amount : -entry.amount);
            accountLots.set(
                accountId,
                isPositiveNumber(quantity)
                    ? lots
                          .map(lot => ({ ...lot, amount: (lot.amount * Math.max(0, nextQuantity)) / quantity }))
                          .filter(lot => isPositiveNumber(lot.amount))
                    : [{ amount: Math.max(0, nextQuantity), baseAmount: 0 }].filter(lot => isPositiveNumber(lot.amount))
            );
        } else if (entry.type === TransactionEntryTypeEnum.DEBIT) {
            accountLots.set(
                accountId,
                lots
                    .concat({
                        amount: entry.amount,
                        baseAmount: isDefined(entry.baseAmount) ? entry.baseAmount + (entry.feeBaseAmount ?? 0) : null
                    })
                    .filter(lot => isPositiveNumber(lot.amount))
            );
        } else {
            const { consumed, remaining } = consumeLots(lots, entry.amount);
            if (
                entry.type === TransactionEntryTypeEnum.CREDIT &&
                entry.isAdjustment !== true &&
                isDefined(entry.baseAmount) &&
                consumed.every(lot => isDefined(lot.baseAmount)) &&
                (!isDefined(accountIds) || accountIds.includes(accountId))
            ) {
                realizedProfitLossMicro +=
                    entry.baseAmount - (entry.feeBaseAmount ?? 0) - consumed.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0);
            }
            accountLots.set(accountId, remaining);
        }
    }
    const lots = [...accountLots]
        .flatMap(([accountId, openLots]) => (!isDefined(accountIds) || accountIds.includes(accountId) ? openLots : []))
        .filter(lot => isDefined(lot.baseAmount) && isPositiveNumber(lot.amount));
    const amountMicro = lots.reduce((total, lot) => total + lot.amount, 0);
    const costBasisMicro = isNotEmptyArray(lots) ? lots.reduce((total, lot) => total + (lot.baseAmount ?? 0), 0) : null;

    return {
        amount: convertFromMicroUnits(amountMicro),
        realizedProfitLoss: convertFromMicroUnits(realizedProfitLossMicro),
        costBasis: isDefined(costBasisMicro) ? convertFromMicroUnits(costBasisMicro) : null,
        averageCost: isDefined(costBasisMicro) && isPositiveNumber(amountMicro) ? costBasisMicro / amountMicro : null
    };
};
