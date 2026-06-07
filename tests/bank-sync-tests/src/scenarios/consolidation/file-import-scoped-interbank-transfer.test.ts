import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BankAccountTypeEnum, BankProviderEnum, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { AccountTypeEnum, CurrencyEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import {
    fetchCanonicalsOfType,
    fetchTransactionById,
    findMccByCode,
    requireInstrument,
    seed,
    seedBankPair,
    StubFileBankSyncService
} from '../../harness';

import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

import type { FileBasedBankSyncClientInterface } from '@app/sync/interface/file-based-bank-sync-client.interface';
import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';
import type { AccountEntityInterface, ConsolidationScanScopeInterface, MccCategoryLookupInterface } from '@budgie/contracts';

const IMPORTED_AMOUNT = 250;
const OPERATED_AT = new Date('2026-01-13T09:42:53.000Z');
const TRANSFER_CATEGORY = 'transfer';
const TRANSFER_MCC_CODE = '4829';

class SingleIncomeFileClient implements FileBasedBankSyncClientInterface {
    constructor(
        private readonly account: BankAccountInterface,
        private readonly transaction: BankTransactionInterface
    ) {}

    getAccounts(): BankAccountInterface[] {
        return [this.account];
    }

    getTransactions(): BankTransactionInterface[] {
        return [this.transaction];
    }
}

const buildBankAccount = (
    provider: BankProviderEnum,
    externalId: string,
    currencyCode: CurrencyEnum,
    currencyCodeNumeric: number,
    iban: string
): BankAccountInterface => ({
    id: externalId,
    provider,
    currencyCode,
    currencyCodeNumeric,
    balance: IMPORTED_AMOUNT,
    creditLimit: 0,
    type: BankAccountTypeEnum.CHECKING,
    iban
});

const buildIncomeTransaction = (
    provider: BankProviderEnum,
    externalId: string,
    accountId: string,
    currencyCode: number
): BankTransactionInterface => ({
    id: externalId,
    provider,
    accountId,
    type: BankTransactionTypeEnum.INCOME,
    time: Math.floor(OPERATED_AT.getTime() / 1000),
    description: `${provider} incoming transfer`,
    comment: '',
    mcc: 0,
    originalMcc: 0,
    amount: IMPORTED_AMOUNT,
    operationAmount: IMPORTED_AMOUNT,
    currencyCode,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: IMPORTED_AMOUNT,
    hold: false,
    category: TRANSFER_CATEGORY,
    feeAmount: 0
});

const expectTransferPairCanonical = (result: { readonly consolidated: number }, sourceAccountId: number): void => {
    expect(result.consolidated).toBe(1);
    const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
    expect(fetchTransactionById(canonicals[0].id).toAccountId).not.toBe(sourceAccountId);
};

const seedExistingBankExpense = (
    externalSource: ExternalSourceEnum,
    externalId: string,
    title: string,
    instrumentId: number,
    mccCategoryId: number
): AccountEntityInterface => {
    const account = seed.account({
        title,
        type: AccountTypeEnum.BANK_SYNC,
        externalId,
        externalSource,
        iban: `${externalId}-IBAN`,
        instrumentId
    });

    seedBankPair.expense(
        { externalId: `${externalId}-expense`, operatedAt: OPERATED_AT },
        { accountId: account.id, amount: IMPORTED_AMOUNT * PRECISION, mccCategoryId }
    );

    return account;
};

const buildSyncService = (
    externalSource: ExternalSourceEnum,
    provider: BankProviderEnum,
    accountExternalId: string,
    currencyCode: CurrencyEnum,
    currencyCodeNumeric: number,
    iban: string,
    categoryLookup: MccCategoryLookupInterface
): StubFileBankSyncService =>
    new StubFileBankSyncService(
        externalSource,
        new SingleIncomeFileClient(
            buildBankAccount(provider, accountExternalId, currencyCode, currencyCodeNumeric, iban),
            buildIncomeTransaction(provider, `${accountExternalId}-income`, accountExternalId, currencyCodeNumeric)
        ),
        new Map([[TRANSFER_CATEGORY, categoryLookup]])
    );

const getQueuedConsolidationScope = (): ConsolidationScanScopeInterface | null => {
    const calls = vi.mocked(transferConsolidationDrainerService.enqueue).mock.calls;

    return calls[0]?.[1] ?? null;
};

const buildMccCategoryLookup = (): MccCategoryLookupInterface => {
    const transferMcc = findMccByCode(TRANSFER_MCC_CODE);

    return {
        id: transferMcc.id,
        defaultCategoryId: null
    };
};

const importAndRunQueuedScope = async (syncService: StubFileBankSyncService, accountExternalId: string) => {
    await syncService.executeImportForSelectedAccounts('statement-file', [accountExternalId]);

    const scope = getQueuedConsolidationScope();
    expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(TransferConsolidationDrainReasonEnum.FILE_IMPORT, scope);
    expect(scope).toBeDefined();
    if (!isDefined(scope)) {
        return { consolidated: 0 };
    }

    return transferConsolidationService.consolidate(scope);
};

describe('consolidation/file-import-scoped-interbank-transfer', () => {
    beforeEach(() => {
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();
    });

    it.each<
        [
            string,
            ExternalSourceEnum,
            string,
            string,
            CurrencyEnum,
            ExternalSourceEnum,
            BankProviderEnum,
            string,
            CurrencyEnum,
            number,
            string
        ]
    >([
        [
            'consolidates an existing Monobank expense with an imported Privatbank income using the import scope',
            ExternalSourceEnum.MONOBANK,
            'mono-source',
            'Monobank source',
            CurrencyEnum.UAH,
            ExternalSourceEnum.PRIVATBANK,
            BankProviderEnum.PRIVATBANK,
            'privat-target',
            CurrencyEnum.UAH,
            980,
            'UA-PRIVAT-TARGET'
        ],
        [
            'consolidates an existing Monobank expense with an imported Erste income using the import scope',
            ExternalSourceEnum.MONOBANK,
            'mono-source',
            'Monobank source',
            CurrencyEnum.EUR,
            ExternalSourceEnum.ERSTE,
            BankProviderEnum.ERSTE,
            'AT123',
            CurrencyEnum.EUR,
            978,
            'AT123'
        ],
        [
            'consolidates an existing Privatbank expense with an imported Erste income using the import scope',
            ExternalSourceEnum.PRIVATBANK,
            'privat-source',
            'Privatbank source',
            CurrencyEnum.EUR,
            ExternalSourceEnum.ERSTE,
            BankProviderEnum.ERSTE,
            'AT123',
            CurrencyEnum.EUR,
            978,
            'AT123'
        ],
        [
            'consolidates an existing Erste expense with an imported Privatbank income using the import scope',
            ExternalSourceEnum.ERSTE,
            'AT456',
            'Erste source',
            CurrencyEnum.EUR,
            ExternalSourceEnum.PRIVATBANK,
            BankProviderEnum.PRIVATBANK,
            'privat-target',
            CurrencyEnum.EUR,
            978,
            'UA-PRIVAT-TARGET'
        ]
    ])(
        '%s',
        async (
            _caseTitle,
            sourceExternalSource,
            sourceExternalId,
            sourceTitle,
            sourceCurrency,
            targetExternalSource,
            targetProvider,
            targetExternalId,
            targetCurrency,
            targetCurrencyCodeNumeric,
            targetIban
        ) => {
            const instrument = await requireInstrument(sourceCurrency);
            const transferMcc = buildMccCategoryLookup();
            const sourceAccount = seedExistingBankExpense(
                sourceExternalSource,
                sourceExternalId,
                sourceTitle,
                instrument.id,
                transferMcc.id
            );
            const syncService = buildSyncService(
                targetExternalSource,
                targetProvider,
                targetExternalId,
                targetCurrency,
                targetCurrencyCodeNumeric,
                targetIban,
                transferMcc
            );

            const result = await importAndRunQueuedScope(syncService, targetExternalId);

            expectTransferPairCanonical(result, sourceAccount.id);
        }
    );
});
