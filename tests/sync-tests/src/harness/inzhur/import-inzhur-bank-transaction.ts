import { ExternalSourceEnum } from '@budgie/contracts';
import { TransactionImportService, TransactionService } from '@budgie/ledger';
import { mapBankTransactionToCreateInput, SyncProviderEnum, SyncTransactionTypeEnum } from '@budgie/sync';
import * as Effect from 'effect/Effect';

const MILLISECONDS_PER_SECOND = 1000;
const UAH_CURRENCY_CODE = 980;

export const importInzhurBankTransaction = Effect.fnUntraced(function* (
    accountId: number,
    externalId: string,
    description: string,
    amount: number,
    operatedAt: Date
) {
    const transactionImportService = yield* TransactionImportService;
    const transactionService = yield* TransactionService;
    const existingTransactionIdMap = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.MONOBANK);
    const input = mapBankTransactionToCreateInput(
        {
            id: externalId,
            time: operatedAt.getTime() / MILLISECONDS_PER_SECOND,
            description,
            mcc: 0,
            originalMcc: 0,
            amount,
            operationAmount: amount,
            currencyCode: UAH_CURRENCY_CODE,
            commissionRate: 0,
            cashbackAmount: 0,
            balance: 0,
            hold: false,
            provider: SyncProviderEnum.MONOBANK,
            accountId: 'inzhur-test-card',
            type: amount < 0 ? SyncTransactionTypeEnum.EXPENSE : SyncTransactionTypeEnum.INCOME,
            feeAmount: 0
        },
        accountId,
        null,
        ExternalSourceEnum.MONOBANK
    );
    yield* transactionImportService.bulkUpsertPreparedImported(
        transactionImportService.prepareImportedInputs([input], existingTransactionIdMap)
    );
});
