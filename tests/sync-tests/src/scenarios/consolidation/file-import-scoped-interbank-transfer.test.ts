import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountTypeEnum, CurrencyEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, SyncTransactionTypeEnum } from '@budgie/sync';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { AccountEntityInterface, ConsolidationScanScopeInterface, MccCategoryLookupInterface } from '@budgie/contracts';
import type { SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const CURRENCY_CODE_EUR = 978;
const CURRENCY_CODE_UAH = 980;
const IMPORTED_AMOUNT = 250;
const OPERATED_AT = new Date('2026-01-13T09:42:53.000Z');
const STATEMENT_FILE_URI = 'statement-file';
const TRANSFER_CATEGORY = 'transfer';
const TRANSFER_MCC_CODE = '4829';

interface ExistingExpenseInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly externalId: string;
    readonly title: string;
    readonly currency: CurrencyEnum;
}

interface ImportedIncomeInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly provider: SyncProviderEnum;
    readonly externalId: string;
    readonly currency: CurrencyEnum;
    readonly currencyCodeNumeric: number;
    readonly iban: string;
}

interface InterbankTransferCaseInterface {
    readonly title: string;
    readonly source: ExistingExpenseInterface;
    readonly target: ImportedIncomeInterface;
}

class SingleIncomeFileClient implements FileBasedSyncClientInterface {
    constructor(
        private readonly account: SyncAccountInterface,
        private readonly transaction: SyncTransactionInterface
    ) {}

    getAccounts(): SyncAccountInterface[] {
        return [this.account];
    }

    getTransactions(): SyncTransactionInterface[] {
        return [this.transaction];
    }
}

const enqueueSpy = vi.spyOn(transferConsolidationDrainerService, 'enqueue');

const buildBankAccount = (target: ImportedIncomeInterface): SyncAccountInterface => ({
    id: target.externalId,
    provider: target.provider,
    currencyCode: target.currency,
    currencyCodeNumeric: target.currencyCodeNumeric,
    balance: IMPORTED_AMOUNT,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CHECKING,
    iban: target.iban
});

const buildIncomeTransaction = (target: ImportedIncomeInterface): SyncTransactionInterface => ({
    id: `${target.externalId}-income`,
    provider: target.provider,
    accountId: target.externalId,
    type: SyncTransactionTypeEnum.INCOME,
    time: Math.floor(OPERATED_AT.getTime() / 1000),
    description: `${target.provider} incoming transfer`,
    comment: '',
    mcc: 0,
    originalMcc: 0,
    amount: IMPORTED_AMOUNT,
    operationAmount: IMPORTED_AMOUNT,
    currencyCode: target.currencyCodeNumeric,
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

const seedExistingBankExpense = (source: ExistingExpenseInterface, instrumentId: number, mccCategoryId: number): AccountEntityInterface => {
    const account = seed.account({
        title: source.title,
        type: AccountTypeEnum.BANK_SYNC,
        externalId: source.externalId,
        externalSource: source.externalSource,
        iban: `${source.externalId}-IBAN`,
        instrumentId
    });

    seedBankPair.expense(
        { externalId: `${source.externalId}-expense`, operatedAt: OPERATED_AT },
        { accountId: account.id, amount: IMPORTED_AMOUNT * PRECISION, mccCategoryId }
    );

    return account;
};

const buildSyncService = (target: ImportedIncomeInterface, categoryLookup: MccCategoryLookupInterface): StubFileBankSyncService =>
    new StubFileBankSyncService(
        target.externalSource,
        new SingleIncomeFileClient(buildBankAccount(target), buildIncomeTransaction(target)),
        new Map([[TRANSFER_CATEGORY, categoryLookup]])
    );

const getQueuedConsolidationScope = (): ConsolidationScanScopeInterface | null => enqueueSpy.mock.calls[0]?.[1] ?? null;

const buildMccCategoryLookup = (): MccCategoryLookupInterface => {
    const transferMcc = findMccByCode(TRANSFER_MCC_CODE);

    return {
        id: transferMcc.id,
        defaultCategoryId: null
    };
};

const importAndRunQueuedScope = async (syncService: StubFileBankSyncService, accountExternalId: string) => {
    await syncService.executeImportForSelectedAccounts(STATEMENT_FILE_URI, [accountExternalId]);

    const scope = getQueuedConsolidationScope();
    expect(enqueueSpy).toHaveBeenCalledWith(TransferConsolidationDrainReasonEnum.FILE_IMPORT, scope);
    expect(scope).toBeDefined();
    if (!isDefined(scope)) {
        return { consolidated: 0 };
    }

    return transferConsolidationService.consolidate(scope);
};

const INTERBANK_TRANSFER_CASES: readonly InterbankTransferCaseInterface[] = [
    {
        title: 'consolidates an existing Monobank expense with an imported Privatbank income using the import scope',
        source: {
            externalSource: ExternalSourceEnum.MONOBANK,
            externalId: 'mono-source',
            title: 'Monobank source',
            currency: CurrencyEnum.UAH
        },
        target: {
            externalSource: ExternalSourceEnum.PRIVATBANK,
            provider: SyncProviderEnum.PRIVATBANK,
            externalId: 'privat-target',
            currency: CurrencyEnum.UAH,
            currencyCodeNumeric: CURRENCY_CODE_UAH,
            iban: 'UA-PRIVAT-TARGET'
        }
    },
    {
        title: 'consolidates an existing Monobank expense with an imported Erste income using the import scope',
        source: {
            externalSource: ExternalSourceEnum.MONOBANK,
            externalId: 'mono-source',
            title: 'Monobank source',
            currency: CurrencyEnum.EUR
        },
        target: {
            externalSource: ExternalSourceEnum.ERSTE,
            provider: SyncProviderEnum.ERSTE,
            externalId: 'AT123',
            currency: CurrencyEnum.EUR,
            currencyCodeNumeric: CURRENCY_CODE_EUR,
            iban: 'AT123'
        }
    },
    {
        title: 'consolidates an existing Privatbank expense with an imported Erste income using the import scope',
        source: {
            externalSource: ExternalSourceEnum.PRIVATBANK,
            externalId: 'privat-source',
            title: 'Privatbank source',
            currency: CurrencyEnum.EUR
        },
        target: {
            externalSource: ExternalSourceEnum.ERSTE,
            provider: SyncProviderEnum.ERSTE,
            externalId: 'AT123',
            currency: CurrencyEnum.EUR,
            currencyCodeNumeric: CURRENCY_CODE_EUR,
            iban: 'AT123'
        }
    },
    {
        title: 'consolidates an existing Erste expense with an imported Privatbank income using the import scope',
        source: {
            externalSource: ExternalSourceEnum.ERSTE,
            externalId: 'AT456',
            title: 'Erste source',
            currency: CurrencyEnum.EUR
        },
        target: {
            externalSource: ExternalSourceEnum.PRIVATBANK,
            provider: SyncProviderEnum.PRIVATBANK,
            externalId: 'privat-target',
            currency: CurrencyEnum.EUR,
            currencyCodeNumeric: CURRENCY_CODE_EUR,
            iban: 'UA-PRIVAT-TARGET'
        }
    }
];

describe('consolidation/file-import-scoped-interbank-transfer', () => {
    beforeEach(() => {
        enqueueSpy.mockClear();
    });

    it.each(INTERBANK_TRANSFER_CASES)('$title', async ({ source, target }) => {
        const instrument = await requireInstrument(source.currency);
        const transferMcc = buildMccCategoryLookup();
        const sourceAccount = seedExistingBankExpense(source, instrument.id, transferMcc.id);
        const syncService = buildSyncService(target, transferMcc);

        const result = await importAndRunQueuedScope(syncService, target.externalId);

        expectTransferPairCanonical(result, sourceAccount.id);
    });
});
