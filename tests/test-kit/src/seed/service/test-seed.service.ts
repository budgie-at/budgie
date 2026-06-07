/* eslint-disable max-lines -- Cohesive shared test seed harness */
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

import { isDefined } from '@rnw-community/shared';

import type { ChainReclaimScenarioInputInterface } from '../interface/chain-reclaim-scenario-input.interface';
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
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

const SECONDS_PER_DAY = 86_400;
const DEFAULT_BASE_YEAR = 2026;

export class TestSeedService {
    private static readonly DEFAULT_REFUND_TITLE = 'STARBUCKS #1234';
    private static readonly DEFAULT_REFUND_DELAY_SECONDS = SECONDS_PER_DAY;
    private static readonly DEFAULT_TRANSFER_OPERATED_AT = new Date(DEFAULT_BASE_YEAR, 0, 15, 12, 0, 0);
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
                iban: input.iban ?? null
            } satisfies AccountCreateEntityInterface)
            .returning()
            .all();

        return this.requireInserted(rows, 'accounts');
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Existing test seed helper keeps positional arguments
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

    // eslint-disable-next-line max-statements -- Multi-step test seed helper builds transaction + entries
    directTransfer(input: {
        readonly fromAccountId: number;
        readonly toAccountId: number;
        readonly fromAmount: number;
        readonly toAmount: number;
        readonly operatedAt?: Date;
        readonly exchangeRate?: number;
        readonly fromEntryExchangeRate?: number;
        readonly toEntryExchangeRate?: number;
        readonly fromEntryToIban?: string | null;
        readonly externalIdPrefix?: string;
        readonly title?: string;
        readonly consolidationType?: TransactionConsolidationTypeEnum | null;
        readonly withBackingSources?: boolean;
    }): {
        readonly transfer: TransactionEntityInterface;
        readonly fromEntry: TransactionEntryEntityInterface;
        readonly toEntry: TransactionEntryEntityInterface;
        readonly backingExpense: TransactionEntityInterface | null;
        readonly backingIncome: TransactionEntityInterface | null;
    } {
        const operatedAt = input.operatedAt ?? TestSeedService.DEFAULT_TRANSFER_OPERATED_AT;
        const externalIdPrefix = input.externalIdPrefix ?? 'transfer';
        const consolidationType = 'consolidationType' in input ? input.consolidationType : TransactionConsolidationTypeEnum.TRANSFER_PAIR;
        const transferRows = this.database
            .insert(TransactionEntityTable)
            .values({
                type: TransactionTypeEnum.TRANSFER,
                title: input.title ?? 'Direct Transfer',
                externalId: `${externalIdPrefix}-transfer`,
                externalSource: ExternalSourceEnum.MONOBANK,
                operatedAt,
                exchangeRate: input.exchangeRate ?? 1,
                fromAccountId: input.fromAccountId,
                toAccountId: input.toAccountId,
                comment: '',
                consolidationType,
                updatedBy: null
            } satisfies TransactionCreateEntityInterface)
            .returning()
            .all();
        const transfer = this.requireInserted(transferRows, 'transactions');
        const fromEntry = this.insertTransferEntry(transfer.id, TransactionEntryTypeEnum.CREDIT, `${externalIdPrefix}-from`, {
            accountId: input.fromAccountId,
            amount: input.fromAmount,
            exchangeRate: input.fromEntryExchangeRate ?? 1,
            toIban: input.fromEntryToIban ?? null
        });
        const toEntry = this.insertTransferEntry(transfer.id, TransactionEntryTypeEnum.DEBIT, `${externalIdPrefix}-to`, {
            accountId: input.toAccountId,
            amount: input.toAmount,
            exchangeRate: input.toEntryExchangeRate ?? 1,
            toIban: null
        });

        if (input.withBackingSources !== true) {
            return { transfer, fromEntry, toEntry, backingExpense: null, backingIncome: null };
        }

        const backingExpense = this.bankPairExpense(
            { externalId: `${externalIdPrefix}-backing-expense`, operatedAt },
            { accountId: input.fromAccountId, amount: input.fromAmount, exchangeRate: input.fromEntryExchangeRate ?? 1 }
        );
        const backingIncome = this.bankPairIncome(
            { externalId: `${externalIdPrefix}-backing-income`, operatedAt },
            { accountId: input.toAccountId, amount: input.toAmount, exchangeRate: input.toEntryExchangeRate ?? 1 }
        );

        this.moveEntryIntoCanonical(`${externalIdPrefix}-backing-expense`, backingExpense.id, transfer.id);
        this.moveEntryIntoCanonical(`${externalIdPrefix}-backing-income`, backingIncome.id, transfer.id);
        this.setConsolidationParent(backingExpense.id, transfer.id);
        this.setConsolidationParent(backingIncome.id, transfer.id);

        return { transfer, fromEntry, toEntry, backingExpense, backingIncome };
    }

    feeEntry(transactionId: number, accountId: number, amount: number, externalId: string): TransactionEntryEntityInterface {
        return this.insertTransferEntry(transactionId, TransactionEntryTypeEnum.FEE, externalId, { accountId, amount });
    }

    chainReclaimScenario(input: ChainReclaimScenarioInputInterface): {
        readonly sourceAccount: AccountEntityInterface;
        readonly bridgeAccount: AccountEntityInterface;
        readonly targetAccount: AccountEntityInterface;
        readonly transfer: TransactionEntityInterface;
        readonly backingExpense: TransactionEntityInterface | null;
        readonly backingIncome: TransactionEntityInterface | null;
        readonly bridgeIncome: TransactionEntityInterface;
        readonly bridgeExpense: TransactionEntityInterface;
    } {
        const usdInstrument = this.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
        const sourceAccount = this.bankSyncAccount('Source USD', null, 'UA-SOURCE', usdInstrument.id);
        const bridgeAccount = this.bankSyncAccount('Bridge UAH', null, 'UA-BRIDGE', input.bridgeInstrumentId ?? 1);
        const targetAccount = this.bankSyncAccount('Target UAH', null, 'UA-TARGET', 1);
        const bridgeOffset = input.bridgeOperatedAtOffsetMs ?? 10_000;
        const gateMatchingExchangeRate = input.sourceAmount / input.targetAmount;
        const { transfer, backingExpense, backingIncome } = this.directTransfer({
            fromAccountId: sourceAccount.id,
            toAccountId: targetAccount.id,
            fromAmount: input.sourceAmount,
            toAmount: input.targetAmount,
            operatedAt: input.operatedAt,
            exchangeRate: input.transferExchangeRate ?? gateMatchingExchangeRate,
            fromEntryExchangeRate: input.transferFromEntryExchangeRate ?? gateMatchingExchangeRate,
            toEntryExchangeRate: input.transferToEntryExchangeRate ?? 1,
            fromEntryToIban: input.transferFromEntryToIban ?? 'UA-TARGET',
            withBackingSources: true
        });
        const bridgeIncome = this.bankPairIncome(
            { externalId: 'bridge-income', operatedAt: new Date(input.operatedAt.getTime() + bridgeOffset) },
            {
                accountId: bridgeAccount.id,
                amount: input.bridgeIncomeAmount ?? input.targetAmount,
                exchangeRate: input.bridgeExchangeRate,
                toIban: input.bridgeIncomeToIban ?? 'UA-SOURCE'
            }
        );
        const bridgeExpense = this.bankPairExpense(
            { externalId: 'bridge-expense', operatedAt: new Date(input.operatedAt.getTime() + bridgeOffset + 2_000) },
            {
                accountId: bridgeAccount.id,
                amount: input.bridgeExpenseAmount ?? input.targetAmount,
                exchangeRate: 1,
                toIban: input.bridgeExpenseToIban ?? 'UA-TARGET'
            }
        );

        return { sourceAccount, bridgeAccount, targetAccount, transfer, backingExpense, backingIncome, bridgeIncome, bridgeExpense };
    }

    refundedExpense(input: {
        readonly accountId: number;
        readonly expenseAmount: number;
        readonly refundAmounts: readonly number[];
        readonly expenseOperatedAt?: Date;
        readonly externalIdPrefix?: string;
        readonly mccCategoryId?: number | null;
        readonly refundAccountId?: number;
        readonly refundDelaySeconds?: number;
        readonly refundMccCategoryId?: number | null;
        readonly refundTitle?: string;
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
        const refunds = input.refundAmounts.map((refundAmount, index) => {
            const operatedAt = new Date(expenseOperatedAt.getTime() + refundDelaySeconds * 1000 * (index + 1));

            return this.incomeTransaction(
                {
                    externalId: `${externalIdPrefix}-refund-${index}`,
                    operatedAt,
                    title: refundTitle
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

    // eslint-disable-next-line @typescript-eslint/max-params -- Existing test seed helper keeps positional arguments
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
        this.insertTransferEntry(transactionId, entryType, externalId, {
            accountId: entry.accountId,
            amount: entry.amount,
            exchangeRate: entry.exchangeRate,
            toIban: entry.toIban,
            mccCategoryId: entry.mccCategoryId
        });
    }

    private moveEntryIntoCanonical(entryExternalId: string, sourceTransactionId: number, canonicalTransactionId: number): void {
        this.database
            .update(TransactionEntryEntityTable)
            .set({
                transactionId: canonicalTransactionId,
                originalTransactionId: sourceTransactionId
            })
            .where(eq(TransactionEntryEntityTable.externalId, entryExternalId))
            .run();
    }

    private setConsolidationParent(sourceTransactionId: number, canonicalTransactionId: number): void {
        this.database
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonicalTransactionId })
            .where(eq(TransactionEntityTable.id, sourceTransactionId))
            .run();
    }

    private insertTransferEntry(
        transactionId: number,
        entryType: TransactionEntryTypeEnum,
        externalId: string | null,
        entry: {
            readonly accountId: number;
            readonly amount: number;
            readonly exchangeRate?: number;
            readonly toIban?: string | null;
            readonly mccCategoryId?: number | null;
        }
    ): TransactionEntryEntityInterface {
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

        return this.requireInserted(entryRows, 'transaction_entries');
    }

    private requireInserted<T>(rows: readonly T[], tableName: string): T {
        const [row] = rows;

        if (!isDefined(row)) {
            throw new Error(`Failed to insert into ${tableName}`);
        }

        return row;
    }
}
