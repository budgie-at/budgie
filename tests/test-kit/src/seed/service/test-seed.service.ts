import {
    AccountEntityTable,
    AccountNatureEnum,
    AccountTypeEnum,
    BankSyncEntityTable,
    BankSyncModeEnum,
    BankSyncStatusEnum,
    ExternalSourceEnum,
    InstrumentEntityTable,
    InstrumentTypeEnum,
    MccCategoryEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { SeedBankPairEntryInputType } from '../interface/seed-bank-pair-entry-input.type';
import type {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    BankSyncCreateEntityInterface,
    BankSyncEntityInterface,
    DB,
    InstrumentCreateEntityInterface,
    InstrumentEntityInterface,
    MccCategoryCreateEntityInterface,
    MccCategoryEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

export class TestSeedService {
    constructor(private readonly database: DB) {}

    instrument(input: Partial<InstrumentCreateEntityInterface> = {}): InstrumentEntityInterface {
        const rows = this.database
            .insert(InstrumentEntityTable)
            .values({
                code: input.code ?? 'UAH',
                name: input.name ?? 'Hryvnia',
                symbol: input.symbol ?? '₴',
                type: input.type ?? InstrumentTypeEnum.FIAT
            } satisfies InstrumentCreateEntityInterface)
            .returning()
            .all();

        return this.requireInserted(rows, 'instruments');
    }

    account(input: Partial<AccountCreateEntityInterface> = {}): AccountEntityInterface {
        const rows = this.database
            .insert(AccountEntityTable)
            .values({
                title: input.title ?? 'Test Account',
                type: input.type ?? AccountTypeEnum.BANK_SYNC,
                nature: input.nature ?? AccountNatureEnum.ASSET,
                icon: input.icon ?? UserIconNameEnum.Wallet,
                order: input.order ?? 0,
                instrumentId: input.instrumentId ?? 1,
                externalId: input.externalId ?? null,
                externalSource: input.externalSource ?? null,
                iban: input.iban ?? null
            } satisfies AccountCreateEntityInterface)
            .returning()
            .all();

        return this.requireInserted(rows, 'accounts');
    }

    bankSync(input: Partial<BankSyncCreateEntityInterface> & Pick<BankSyncCreateEntityInterface, 'accountId'>): BankSyncEntityInterface {
        const rows = this.database
            .insert(BankSyncEntityTable)
            .values({
                accountId: input.accountId,
                token: input.token ?? 'test-token',
                provider: input.provider ?? ExternalSourceEnum.MONOBANK,
                mode: input.mode ?? BankSyncModeEnum.FORWARD,
                status: input.status ?? BankSyncStatusEnum.IDLE,
                enabled: input.enabled ?? true,
                forwardSyncFromAt: input.forwardSyncFromAt ?? new Date(),
                forwardSyncedAt: input.forwardSyncedAt ?? null,
                backwardSyncFromAt: input.backwardSyncFromAt ?? null,
                backwardSyncedAt: input.backwardSyncedAt ?? null,
                transactionCount: input.transactionCount ?? 0,
                errorCount: input.errorCount ?? 0,
                lastError: input.lastError ?? null
            } satisfies BankSyncCreateEntityInterface)
            .returning()
            .all();

        return this.requireInserted(rows, 'bank_syncs');
    }

    mccCategory(
        input: Partial<MccCategoryCreateEntityInterface> & Pick<MccCategoryCreateEntityInterface, 'mcc'>
    ): MccCategoryEntityInterface {
        const rows = this.database
            .insert(MccCategoryEntityTable)
            .values({
                mcc: input.mcc,
                mccGroupId: input.mccGroupId ?? 1,
                fullDescription: input.fullDescription ?? `MCC ${input.mcc}`,
                shortDescription: input.shortDescription ?? `MCC ${input.mcc}`
            } satisfies MccCategoryCreateEntityInterface)
            .returning()
            .all();

        return this.requireInserted(rows, 'mcc_categories');
    }

    accountPair(
        fromIban: string | null = null,
        toIban: string | null = null
    ): {
        readonly fromAccount: AccountEntityInterface;
        readonly toAccount: AccountEntityInterface;
    } {
        return {
            fromAccount: this.account({ externalId: 'mono-from', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: fromIban }),
            toAccount: this.account({ externalId: 'mono-to', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: toIban })
        };
    }

    amountTransferPair(
        amount: number,
        mccCategoryId: number,
        operatedAt: Date = new Date(2026, 0, 15, 12, 0, 0)
    ): {
        readonly expense: TransactionEntityInterface;
        readonly fromAccount: AccountEntityInterface;
        readonly income: TransactionEntityInterface;
        readonly toAccount: AccountEntityInterface;
    } {
        const { fromAccount, toAccount } = this.accountPair();
        const expense = this.bankPairExpense(
            { externalId: 'tx-expense', operatedAt },
            { accountId: fromAccount.id, amount, mccCategoryId }
        );
        const income = this.bankPairIncome(
            { externalId: 'tx-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount, mccCategoryId }
        );

        return { fromAccount, toAccount, expense, income };
    }

    bankPairExpense(
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        return this.bankPairSide(TransactionTypeEnum.EXPENSE, transaction, entry);
    }

    bankPairIncome(
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        return this.bankPairSide(TransactionTypeEnum.INCOME, transaction, entry);
    }

    private bankPairSide(
        type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        const entryType = type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
        const fromAccountId = type === TransactionTypeEnum.EXPENSE ? entry.accountId : null;
        const toAccountId = type === TransactionTypeEnum.INCOME ? entry.accountId : null;
        const transactionRows = this.database
            .insert(TransactionEntityTable)
            .values({
                type,
                title: `${type} ${transaction.externalId}`,
                externalId: transaction.externalId,
                externalSource: ExternalSourceEnum.MONOBANK,
                operatedAt: transaction.operatedAt,
                exchangeRate: entry.exchangeRate ?? 1,
                fromAccountId,
                toAccountId,
                comment: '',
                updatedBy: null
            } satisfies TransactionCreateEntityInterface)
            .returning()
            .all();
        const inserted = this.requireInserted(transactionRows, 'transactions');

        const entryRows = this.database
            .insert(TransactionEntryEntityTable)
            .values({
                transactionId: inserted.id,
                accountId: entry.accountId,
                type: entryType,
                amount: entry.amount,
                externalId: transaction.externalId,
                exchangeRate: entry.exchangeRate ?? 1,
                toIban: entry.toIban ?? null,
                categoryId: null,
                mccCategoryId: entry.mccCategoryId ?? null,
                originalTransactionId: null
            } satisfies TransactionEntryCreateEntityInterface)
            .returning()
            .all();

        this.requireInserted(entryRows, 'transaction_entries');

        return inserted;
    }

    private requireInserted<T>(rows: readonly T[], tableName: string): T {
        const row = rows[0];

        if (!isDefined(row)) {
            throw new Error(`Failed to insert into ${tableName}`);
        }

        return row;
    }
}
