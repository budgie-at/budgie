import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import Papa from 'papaparse';

import { isNotEmptyString } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';

const WiseCsvRowSchema = Schema.Struct({
    'TransferWise ID': Schema.NonEmptyString,
    'Date Time': Schema.String.check(Schema.isPattern(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}(?:\.\d{3})?$/u)),
    Amount: Schema.FiniteFromString,
    Currency: Schema.String.check(Schema.isPattern(/^[A-Z]{3}$/u)),
    Description: Schema.String,
    'Payer Name': Schema.String,
    'Payee Name': Schema.String,
    Merchant: Schema.String,
    'Exchange From': Schema.String,
    'Transaction Type': Schema.Literals(['DEBIT', 'CREDIT'])
});

const WISE_CSV_COLUMNS = Object.keys(WiseCsvRowSchema.fields);
const DATE_TIME_PATTERN = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/u;
const MILLISECONDS_PER_SECOND = 1000;

const decodeRow = Schema.decodeUnknownOption(WiseCsvRowSchema);

const parseTime = (dateTime: string): number => {
    const [day, month, year, hours, minutes, seconds] = (DATE_TIME_PATTERN.exec(dateTime) ?? []).slice(1).map(Number);

    return Date.UTC(year, month - 1, day, hours, minutes, seconds) / MILLISECONDS_PER_SECOND;
};

const mapRow = (row: typeof WiseCsvRowSchema.Type): SyncTransactionInterface => {
    const isIncome = row['Transaction Type'] === 'CREDIT';
    const amount = Math.abs(row.Amount);
    const isConversionLeg = isNotEmptyString(row['Exchange From']);
    const idSuffix = isIncome ? ':in' : ':out';

    return {
        id: isConversionLeg ? `${row['TransferWise ID']}${idSuffix}` : row['TransferWise ID'],
        provider: SyncProviderEnum.WISE,
        accountId: row.Currency,
        type: isIncome ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
        time: parseTime(row['Date Time']),
        description: [row.Merchant, row['Payee Name'], row['Payer Name'], row.Description].find(isNotEmptyString) ?? '',
        mcc: 0,
        originalMcc: 0,
        amount,
        operationAmount: amount,
        currencyCode: 0,
        commissionRate: 0,
        cashbackAmount: 0,
        balance: 0,
        hold: false,
        feeAmount: 0
    };
};

export const parseWiseCsv = (text: string): Result.Result<ReadonlyMap<string, SyncTransactionInterface[]>, string> => {
    const { data, meta } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

    if (!WISE_CSV_COLUMNS.every(column => meta.fields?.includes(column))) {
        return Result.fail('Not a Wise statement: the header row is missing expected columns');
    }

    const transactionsByCurrency = new Map<string, SyncTransactionInterface[]>();

    for (const row of data) {
        const decoded = decodeRow(row);

        if (Option.isNone(decoded)) {
            return Result.fail(`Invalid Wise statement row ${row['TransferWise ID'] ?? ''}`.trim());
        }

        const transaction = mapRow(decoded.value);

        transactionsByCurrency.set(transaction.accountId, [...(transactionsByCurrency.get(transaction.accountId) ?? []), transaction]);
    }

    return Result.succeed(transactionsByCurrency);
};
