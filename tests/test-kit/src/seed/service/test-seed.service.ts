import {
    AccountEntityTable,
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountTypeEnum,
    BankSyncEntityTable,
    BankSyncModeEnum,
    BankSyncStatusEnum,
    ExternalSourceEnum,
    InstrumentEntityTable,
    InstrumentTypeEnum,
    MccCategoryEntityTable,
    TagEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

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
    private static readonly DEFAULT_REFUND_TITLE = 'STARBUCKS #1234';
    private static readonly DEFAULT_REFUND_DELAY_SECONDS = 24 * 60 * 60;
    private static readonly DEFAULT_TRANSFER_OPERATED_AT = new Date('2026-01-15T12:00:00');
    private static readonly DEFAULT_BASE_INSTRUMENT_ID = 1;

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
                iban: input.iban ?? null,
                debtType: input.debtType ?? AccountDebtTypeEnum.LENT,
                deadline: input.deadline ?? null,
                parentId: input.parentId ?? null,
                contactId: input.contactId ?? null,
                targetBalance: input.targetBalance ?? 0,
                targetBaseInstrumentId: input.targetBaseInstrumentId ?? null,
                targetBaseExchangeRate: input.targetBaseExchangeRate ?? null,
                targetBaseAmount: input.targetBaseAmount ?? null,
                includeInNetWorth: input.includeInNetWorth ?? true,
                isActive: input.isActive ?? true
            } satisfies AccountCreateEntityInterface)
            .returning()
            .all();

        return this.requireInserted(rows, 'accounts');
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments
    bankSyncAccount(
        title: string,
        externalSource: ExternalSourceEnum | null,
        iban: string | null,
        instrumentId: number = 1,
        icon: UserIconNameEnum = UserIconNameEnum.Landmark
    ): AccountEntityInterface {
        return this.account({
            title,
            type: AccountTypeEnum.BANK_SYNC,
            externalId: title,
            externalSource,
            iban,
            icon,
            instrumentId
        });
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

    tag(title: string): { readonly id: number } {
        const rows = this.database
            .insert(TagEntityTable)
            .values({
                title,
                titleSearch: title.toLowerCase(),
                titleEn: null,
                titleTags: null,
                tagsGeneratedAt: null
            })
            .returning({ id: TagEntityTable.id })
            .all();

        return this.requireInserted(rows, 'tags');
    }

    transactionTag(transactionId: number, tagId: number): void {
        const rows = this.database
            .insert(TransactionTagsEntityTable)
            .values({
                transactionId,
                tagId,
                isPrimary: false
            })
            .returning()
            .all();

        this.requireInserted(rows, 'transaction_tags');
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
        operatedAt: Date = TestSeedService.DEFAULT_TRANSFER_OPERATED_AT
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

    directTransfer(input: {
        readonly consolidationType?: TransactionConsolidationTypeEnum | null;
        readonly exchangeRate: number;
        readonly operatedAt: Date;
        readonly sourceAccountId: number;
        readonly sourceAmount: number;
        readonly sourceEntryExchangeRate: number;
        readonly targetAccountId: number;
        readonly targetAmount: number;
        readonly targetEntryExchangeRate?: number;
        readonly title?: string;
        readonly toIban: string | null;
    }): TransactionEntityInterface {
        const transactionRows = this.database
            .insert(TransactionEntityTable)
            .values({
                type: TransactionTypeEnum.TRANSFER,
                title: input.title ?? 'Generated direct transfer',
                externalId: null,
                externalSource: null,
                operatedAt: input.operatedAt,
                exchangeRate: input.exchangeRate,
                fromAccountId: input.sourceAccountId,
                toAccountId: input.targetAccountId,
                comment: '',
                needsEmbedding: false,
                consolidationParentTransactionId: null,
                consolidationType: input.consolidationType ?? null,
                updatedBy: null
            } satisfies TransactionCreateEntityInterface)
            .returning()
            .all();
        const transfer = this.requireInserted(transactionRows, 'transactions');

        const entryRows = this.database
            .insert(TransactionEntryEntityTable)
            .values([
                {
                    transactionId: transfer.id,
                    accountId: input.sourceAccountId,
                    categoryId: null,
                    mccCategoryId: null,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: input.sourceAmount,
                    externalId: null,
                    exchangeRate: input.sourceEntryExchangeRate,
                    toIban: input.toIban,
                    originalTransactionId: null
                },
                {
                    transactionId: transfer.id,
                    accountId: input.targetAccountId,
                    categoryId: null,
                    mccCategoryId: null,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: input.targetAmount,
                    externalId: null,
                    exchangeRate: input.targetEntryExchangeRate ?? 1,
                    toIban: null,
                    originalTransactionId: null
                }
            ] satisfies TransactionEntryCreateEntityInterface[])
            .returning()
            .all();

        this.requireInserted(entryRows, 'transaction_entries');

        return transfer;
    }

    refundedExpense(input: {
        readonly accountId: number;
        readonly expenseAmount: number;
        readonly refundAmounts: readonly number[];
        readonly expenseFeeAmount?: number;
        readonly expenseOperatedAt?: Date;
        readonly externalIdPrefix?: string;
        readonly mccCategoryId?: number | null;
        readonly refundAccountId?: number;
        readonly refundDelaySeconds?: number;
        readonly refundMccCategoryId?: number | null;
        readonly refundTitle?: string;
        readonly refundTitles?: readonly string[];
        readonly title?: string;
    }): {
        readonly expense: TransactionEntityInterface;
        readonly refunds: TransactionEntityInterface[];
    } {
        const title = input.title ?? TestSeedService.DEFAULT_REFUND_TITLE;
        const refundTitle = input.refundTitle ?? title;
        const refundAccountId = input.refundAccountId ?? input.accountId;
        const expenseOperatedAt = input.expenseOperatedAt ?? TestSeedService.DEFAULT_TRANSFER_OPERATED_AT;
        const refundDelaySeconds = input.refundDelaySeconds ?? TestSeedService.DEFAULT_REFUND_DELAY_SECONDS;
        const externalIdPrefix = input.externalIdPrefix ?? 'rf';
        const expense = this.expenseTransaction(
            {
                externalId: `${externalIdPrefix}-expense`,
                operatedAt: expenseOperatedAt,
                title
            },
            {
                accountId: input.accountId,
                amount: input.expenseAmount,
                mccCategoryId: input.mccCategoryId ?? null
            }
        );

        if (isPositiveNumber(input.expenseFeeAmount)) {
            this.insertEntry(expense.id, TransactionEntryTypeEnum.FEE, `${externalIdPrefix}-expense-fee`, {
                accountId: input.accountId,
                amount: input.expenseFeeAmount
            });
        }

        const refunds = input.refundAmounts.map((refundAmount, index) => {
            const operatedAt = new Date(expenseOperatedAt.getTime() + refundDelaySeconds * 1000 * (index + 1));

            return this.incomeTransaction(
                {
                    externalId: `${externalIdPrefix}-refund-${index}`,
                    operatedAt,
                    title: input.refundTitles?.[index] ?? refundTitle
                },
                {
                    accountId: refundAccountId,
                    amount: refundAmount,
                    mccCategoryId: input.refundMccCategoryId ?? input.mccCategoryId ?? null
                }
            );
        });

        return { expense, refunds };
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

    updateTransaction(
        transactionId: number,
        input: Partial<Pick<TransactionCreateEntityInterface, 'externalSource' | 'title'>>
    ): TransactionEntityInterface {
        const rows = this.database
            .update(TransactionEntityTable)
            .set(input)
            .where(eq(TransactionEntityTable.id, transactionId))
            .returning()
            .all();

        return this.requireInserted(rows, 'transactions');
    }

    feeEntry(transactionId: number, externalId: string | null, entry: SeedBankPairEntryInputType): void {
        this.insertEntry(transactionId, TransactionEntryTypeEnum.FEE, externalId, entry);
    }

    private expenseTransaction(
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt' | 'title'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        return this.singleSideTransaction(TransactionTypeEnum.EXPENSE, transaction, entry);
    }

    private incomeTransaction(
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt' | 'title'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        return this.singleSideTransaction(TransactionTypeEnum.INCOME, transaction, entry);
    }

    private singleSideTransaction(
        type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt' | 'title'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        const fromAccountId = type === TransactionTypeEnum.EXPENSE ? entry.accountId : null;
        const toAccountId = type === TransactionTypeEnum.INCOME ? entry.accountId : null;
        const entryType = type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
        const inserted = this.insertTransaction(type, transaction, fromAccountId, toAccountId, entry.exchangeRate ?? 1);

        this.insertEntry(inserted.id, entryType, transaction.externalId, entry);

        return inserted;
    }

    private bankPairSide(
        type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
        entry: SeedBankPairEntryInputType
    ): TransactionEntityInterface {
        const entryType = type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
        const fromAccountId = type === TransactionTypeEnum.EXPENSE ? entry.accountId : null;
        const toAccountId = type === TransactionTypeEnum.INCOME ? entry.accountId : null;
        const inserted = this.insertTransaction(
            type,
            {
                ...transaction,
                title: `${type} ${transaction.externalId}`
            },
            fromAccountId,
            toAccountId,
            entry.exchangeRate ?? 1
        );

        this.insertEntry(inserted.id, entryType, transaction.externalId, entry);

        return inserted;
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments
    private insertTransaction(
        type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt' | 'title'>,
        fromAccountId: number | null,
        toAccountId: number | null,
        exchangeRate: number
    ): TransactionEntityInterface {
        const transactionRows = this.database
            .insert(TransactionEntityTable)
            .values({
                type,
                title: transaction.title,
                externalId: transaction.externalId,
                externalSource: ExternalSourceEnum.MONOBANK,
                operatedAt: transaction.operatedAt,
                exchangeRate,
                fromAccountId,
                toAccountId,
                comment: '',
                updatedBy: null
            } satisfies TransactionCreateEntityInterface)
            .returning()
            .all();
        const inserted = this.requireInserted(transactionRows, 'transactions');

        return inserted;
    }

    private insertEntry(
        transactionId: number,
        entryType: TransactionEntryTypeEnum,
        externalId: string | null,
        entry: SeedBankPairEntryInputType
    ): void {
        const entryRows = this.database
            .insert(TransactionEntryEntityTable)
            .values({
                transactionId,
                accountId: entry.accountId,
                type: entryType,
                amount: entry.amount,
                externalId,
                exchangeRate: entry.exchangeRate ?? 1,
                baseInstrumentId: TestSeedService.DEFAULT_BASE_INSTRUMENT_ID,
                baseExchangeRate: 1,
                baseAmount: entry.amount,
                toIban: entry.toIban ?? null,
                categoryId: null,
                mccCategoryId: entry.mccCategoryId ?? null,
                originalTransactionId: null
            } satisfies TransactionEntryCreateEntityInterface)
            .returning()
            .all();

        this.requireInserted(entryRows, 'transaction_entries');
    }

    private requireInserted<T>(rows: readonly T[], tableName: string): T {
        const [row] = rows;

        if (!isDefined(row)) {
            throw new Error(`Failed to insert into ${tableName}`);
        }

        return row;
    }
}
