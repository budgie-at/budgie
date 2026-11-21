import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { REFUND_ORIGINAL_CURRENCY_RATE_TOLERANCE } from '../constant/refund-original-currency-rate-tolerance.constant';

import type { TransactionEntryEntityInterface } from '@budgie/contracts';

const getOriginalMinorAmount = (entry: Pick<TransactionEntryEntityInterface, 'amount' | 'exchangeRate'>): number =>
    Math.round(entry.amount / entry.exchangeRate / (PRECISION / 100));

export const isPrivatbankSameOriginalAmount = (
    refundSource: ExternalSourceEnum | null,
    refundEntry: Pick<TransactionEntryEntityInterface, 'amount' | 'exchangeRate' | 'operationInstrumentId'>,
    expenseSource: ExternalSourceEnum | null,
    expenseEntry: Pick<TransactionEntryEntityInterface, 'amount' | 'exchangeRate' | 'operationInstrumentId'>
): boolean =>
    refundSource === ExternalSourceEnum.PRIVATBANK &&
    expenseSource === ExternalSourceEnum.PRIVATBANK &&
    refundEntry.exchangeRate !== 1 &&
    expenseEntry.exchangeRate !== 1 &&
    (!isDefined(refundEntry.operationInstrumentId) ||
        !isDefined(expenseEntry.operationInstrumentId) ||
        refundEntry.operationInstrumentId === expenseEntry.operationInstrumentId) &&
    Math.abs(refundEntry.exchangeRate / expenseEntry.exchangeRate - 1) <= REFUND_ORIGINAL_CURRENCY_RATE_TOLERANCE &&
    getOriginalMinorAmount(refundEntry) === getOriginalMinorAmount(expenseEntry);
