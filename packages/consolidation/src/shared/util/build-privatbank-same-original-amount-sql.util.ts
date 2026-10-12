import { ExternalSourceEnum } from '@budgie/contracts';

import { REFUND_ORIGINAL_CURRENCY_RATE_TOLERANCE } from '../constant/refund-original-currency-rate-tolerance.constant';

import { buildOriginalMinorAmountSql } from './build-original-minor-amount-sql.util';

import type { PrivatbankRefundEntrySqlColumnsInterface } from '../interface/privatbank-refund-entry-sql-columns.interface';

export const buildPrivatbankSameOriginalAmountSql = (
    refund: PrivatbankRefundEntrySqlColumnsInterface,
    expense: PrivatbankRefundEntrySqlColumnsInterface
): string => `${refund.externalSource} = '${ExternalSourceEnum.PRIVATBANK}'
    AND ${expense.externalSource} = '${ExternalSourceEnum.PRIVATBANK}'
    AND ${refund.exchangeRate} != 1 AND ${expense.exchangeRate} != 1
    AND (${refund.operationInstrumentId} IS NULL OR ${expense.operationInstrumentId} IS NULL
        OR ${refund.operationInstrumentId} = ${expense.operationInstrumentId})
    AND ABS(${refund.exchangeRate} / ${expense.exchangeRate} - 1) <= ${REFUND_ORIGINAL_CURRENCY_RATE_TOLERANCE}
    AND ${buildOriginalMinorAmountSql(refund.amount, refund.exchangeRate)} = ${buildOriginalMinorAmountSql(expense.amount, expense.exchangeRate)}`;
