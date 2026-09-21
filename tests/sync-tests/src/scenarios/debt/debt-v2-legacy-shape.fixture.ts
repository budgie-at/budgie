import { testDb } from '../../harness/scenario/setup';

export class DebtV2LegacyShapeFixture {
    static readonly USD_FUNDING_ACCOUNT_ID = 950_001;
    static readonly EUR_FUNDING_ACCOUNT_ID = 950_002;
    static readonly LENT_ACCOUNT_ID = 950_101;
    static readonly BORROW_ACCOUNT_ID = 950_102;
    static readonly MANUAL_ACCOUNT_ID = 950_103;
    static readonly MIRROR_ACCOUNT_ID = 950_104;

    static readonly LENT_OPENING_TRANSACTION_ID = 951_001;
    static readonly BORROW_OPENING_TRANSACTION_ID = 951_002;
    static readonly SAME_INSTRUMENT_REPAYMENT_TRANSACTION_ID = 951_003;
    static readonly CROSS_INSTRUMENT_REPAYMENT_TRANSACTION_ID = 951_004;
    static readonly PLUMBING_MIRROR_TRANSACTION_ID = 951_005;
    static readonly USER_CATEGORY_MIRROR_TRANSACTION_ID = 951_006;
    static readonly PARKED_ADJUSTMENT_TRANSACTION_ID = 951_007;

    static readonly LENT_OPENING_FUNDING_ENTRY_ID = 952_001;
    static readonly LENT_OPENING_DEBT_ENTRY_ID = 952_002;
    static readonly BORROW_OPENING_FUNDING_ENTRY_ID = 952_003;
    static readonly BORROW_OPENING_DEBT_ENTRY_ID = 952_004;
    static readonly SAME_INSTRUMENT_FUNDING_ENTRY_ID = 952_005;
    static readonly SAME_INSTRUMENT_DEBT_ENTRY_ID = 952_006;
    static readonly CROSS_INSTRUMENT_FUNDING_ENTRY_ID = 952_007;
    static readonly CROSS_INSTRUMENT_DEBT_ENTRY_ID = 952_008;
    static readonly PLUMBING_MIRROR_FUNDING_ENTRY_ID = 952_009;
    static readonly PLUMBING_MIRROR_DEBT_ENTRY_ID = 952_010;
    static readonly USER_CATEGORY_FUNDING_ENTRY_ID = 952_011;
    static readonly USER_CATEGORY_MIRROR_DEBT_ENTRY_ID = 952_012;
    static readonly PARKED_ADJUSTMENT_ENTRY_ID = 952_013;

    static readonly LENT_OPENING_EVENT_ID = 953_001;
    static readonly BORROW_OPENING_EVENT_ID = 953_002;
    static readonly SAME_INSTRUMENT_EVENT_ID = 953_003;
    static readonly CROSS_INSTRUMENT_EVENT_ID = 953_004;
    static readonly PLUMBING_MIRROR_EVENT_ID = 953_005;
    static readonly MIRROR_OPENING_EVENT_ID = 953_006;
    static readonly USER_CATEGORY_MIRROR_EVENT_ID = 953_007;
    static readonly MANUAL_OPENING_EVENT_ID = 953_008;
    static readonly MANUAL_CLOSING_EVENT_ID = 953_009;

    static readonly USD_FUNDING_BALANCE_ID = 954_001;
    static readonly MANUAL_BALANCE_ID = 954_002;
    static readonly LENT_BALANCE_ID = 954_003;
    static readonly BORROW_BALANCE_ID = 954_004;
    static readonly MIRROR_BALANCE_ID = 954_005;

    static readonly USER_CATEGORY_ID = 950_901;

    static readonly LENT_PRINCIPAL_AMOUNT = 1_000_000_000;
    static readonly BORROW_PRINCIPAL_AMOUNT = 500_000_000;
    static readonly SAME_INSTRUMENT_REPAYMENT_AMOUNT = 200_000_000;
    static readonly CROSS_INSTRUMENT_FUNDING_AMOUNT = 100_000_000;
    static readonly CROSS_INSTRUMENT_DEBT_AMOUNT = 120_000_000;
    static readonly MIRROR_PRINCIPAL_AMOUNT = 2_000_000_000;
    static readonly PLUMBING_MIRROR_AMOUNT = 300_000_000;
    static readonly USER_CATEGORY_MIRROR_AMOUNT = 100_000_000;
    static readonly PARKED_ADJUSTMENT_AMOUNT = 50_000_000;
    static readonly MANUAL_PRINCIPAL_AMOUNT = 300_000_000;
    static readonly MANUAL_REPAID_AMOUNT = 50_000_000;
    static readonly USD_FUNDING_BALANCE_AMOUNT = 700_000_000;
    static readonly STALE_DEBT_BALANCE_AMOUNT = 12_345_000;

    private static readonly OPERATED_AT = 1_780_358_400;

    async seed(): Promise<void> {
        await testDb.$client.execAsync(this.buildAccountsSql());
        await testDb.$client.execAsync(this.buildTransactionsSql());
        await testDb.$client.execAsync(this.buildTransactionEntriesSql());
        await testDb.$client.execAsync(this.buildDebtEventsSql());
        await testDb.$client.execAsync(this.buildAccountBalancesSql());
    }

    private buildAccountsSql(): string {
        const timestamps = `${DebtV2LegacyShapeFixture.OPERATED_AT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}`;

        return `
            INSERT OR IGNORE INTO categories (id, created_at, updated_at, title, title_search, icon, is_default, is_system_category)
            VALUES (${DebtV2LegacyShapeFixture.USER_CATEGORY_ID}, ${timestamps}, 'Fixture Groceries', 'fixture groceries', 'Wallet', 0, 0);

            INSERT INTO accounts (
                id, created_at, updated_at, title, title_search, type, nature, debt_type, instrument_id, target_balance,
                include_in_net_worth, "order"
            )
            VALUES
                (${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, ${timestamps}, 'Fixture USD wallet', 'fixture usd wallet', 'CASH', 'ASSET', 'LENT', 1, 0, 1, 1),
                (${DebtV2LegacyShapeFixture.EUR_FUNDING_ACCOUNT_ID}, ${timestamps}, 'Fixture EUR wallet', 'fixture eur wallet', 'CASH', 'ASSET', 'LENT', 2, 0, 1, 2),
                (${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, ${timestamps}, 'Fixture lent debt', 'fixture lent debt', 'DEBT', 'ASSET', 'LENT', 1, ${DebtV2LegacyShapeFixture.LENT_PRINCIPAL_AMOUNT}, 0, 3),
                (${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, ${timestamps}, 'Fixture borrowed debt', 'fixture borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, ${DebtV2LegacyShapeFixture.BORROW_PRINCIPAL_AMOUNT}, 0, 4),
                (${DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID}, ${timestamps}, 'Fixture manual debt', 'fixture manual debt', 'DEBT', 'ASSET', 'LENT', 1, ${DebtV2LegacyShapeFixture.MANUAL_PRINCIPAL_AMOUNT}, 0, 5),
                (${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, ${timestamps}, 'Fixture mirrored debt', 'fixture mirrored debt', 'DEBT', 'ASSET', 'LENT', 1, ${DebtV2LegacyShapeFixture.MIRROR_PRINCIPAL_AMOUNT}, 0, 6);
        `;
    }

    private buildTransactionsSql(): string {
        const timestamps = `${DebtV2LegacyShapeFixture.OPERATED_AT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}`;

        return `
            INSERT INTO transactions (
                id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate
            )
            VALUES
                (${DebtV2LegacyShapeFixture.LENT_OPENING_TRANSACTION_ID}, ${timestamps}, 'DEBT', 'Legacy lent opening', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, 1),
                (${DebtV2LegacyShapeFixture.BORROW_OPENING_TRANSACTION_ID}, ${timestamps}, 'DEBT', 'Legacy borrowed opening', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, 1),
                (${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${timestamps}, 'TRANSFER', 'Legacy same instrument repayment', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, 1),
                (${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${timestamps}, 'TRANSFER', 'Legacy cross instrument repayment', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', ${DebtV2LegacyShapeFixture.EUR_FUNDING_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, 1),
                (${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_TRANSACTION_ID}, ${timestamps}, 'INCOME', 'Legacy mirrored repayment', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', NULL, ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, 1),
                (${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_TRANSACTION_ID}, ${timestamps}, 'INCOME', 'Legacy categorised repayment', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', NULL, ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, 1),
                (${DebtV2LegacyShapeFixture.PARKED_ADJUSTMENT_TRANSACTION_ID}, ${timestamps}, 'ADJUSTMENT', 'Legacy parked adjustment', ${DebtV2LegacyShapeFixture.OPERATED_AT}, '', ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, NULL, 1);
        `;
    }

    private buildTransactionEntriesSql(): string {
        const timestamps = `${DebtV2LegacyShapeFixture.OPERATED_AT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}`;

        return `
            INSERT INTO transaction_entries (
                id, created_at, updated_at, type, kind, account_id, category_id, category_source, transaction_id, amount,
                exchange_rate, original_transaction_id
            )
            VALUES
                (${DebtV2LegacyShapeFixture.LENT_OPENING_FUNDING_ENTRY_ID}, ${timestamps}, 'CREDIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.LENT_OPENING_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.LENT_PRINCIPAL_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.LENT_OPENING_DEBT_ENTRY_ID}, ${timestamps}, 'DEBIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.LENT_OPENING_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.LENT_PRINCIPAL_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.BORROW_OPENING_FUNDING_ENTRY_ID}, ${timestamps}, 'DEBIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, 7, 'USER', ${DebtV2LegacyShapeFixture.BORROW_OPENING_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.BORROW_PRINCIPAL_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.BORROW_OPENING_DEBT_ENTRY_ID}, ${timestamps}, 'CREDIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.BORROW_OPENING_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.BORROW_PRINCIPAL_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_FUNDING_ENTRY_ID}, ${timestamps}, 'DEBIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_DEBT_ENTRY_ID}, ${timestamps}, 'CREDIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_FUNDING_ENTRY_ID}, ${timestamps}, 'CREDIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.EUR_FUNDING_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_FUNDING_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_DEBT_ENTRY_ID}, ${timestamps}, 'DEBIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_DEBT_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_FUNDING_ENTRY_ID}, ${timestamps}, 'DEBIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, 17, 'DEBT_SETTLEMENT', ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_DEBT_ENTRY_ID}, ${timestamps}, 'CREDIT', 'DEBT_SETTLEMENT', ${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, 17, 'DEBT_SETTLEMENT', ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.USER_CATEGORY_FUNDING_ENTRY_ID}, ${timestamps}, 'DEBIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.USER_CATEGORY_ID}, 'USER', ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_DEBT_ENTRY_ID}, ${timestamps}, 'CREDIT', 'DEBT_SETTLEMENT', ${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_AMOUNT}, 1, NULL),
                (${DebtV2LegacyShapeFixture.PARKED_ADJUSTMENT_ENTRY_ID}, ${timestamps}, 'CREDIT', 'PRIMARY', ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, NULL, 'USER', ${DebtV2LegacyShapeFixture.PARKED_ADJUSTMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.PARKED_ADJUSTMENT_AMOUNT}, 1, NULL);
        `;
    }

    private buildDebtEventsSql(): string {
        const timestamps = `${DebtV2LegacyShapeFixture.OPERATED_AT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}`;

        return `
            INSERT INTO debt_events (
                id, created_at, updated_at, debt_account_id, transaction_id, transaction_entry_id, direction, source, amount,
                base_instrument_id, base_exchange_rate, base_amount, operated_at
            )
            VALUES
                (${DebtV2LegacyShapeFixture.LENT_OPENING_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.LENT_OPENING_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.LENT_OPENING_DEBT_ENTRY_ID}, 'OPEN', 'TRANSFER', ${DebtV2LegacyShapeFixture.LENT_PRINCIPAL_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.LENT_PRINCIPAL_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.BORROW_OPENING_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.BORROW_OPENING_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.BORROW_OPENING_DEBT_ENTRY_ID}, 'OPEN', 'TRANSFER', ${DebtV2LegacyShapeFixture.BORROW_PRINCIPAL_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.BORROW_PRINCIPAL_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_DEBT_ENTRY_ID}, 'CLOSE', 'TRANSFER', ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.SAME_INSTRUMENT_REPAYMENT_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_REPAYMENT_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_DEBT_ENTRY_ID}, 'CLOSE', 'TRANSFER', ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_DEBT_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.CROSS_INSTRUMENT_DEBT_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.MIRROR_OPENING_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, NULL, NULL, 'OPEN', 'MANUAL', ${DebtV2LegacyShapeFixture.MIRROR_PRINCIPAL_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.MIRROR_PRINCIPAL_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_DEBT_ENTRY_ID}, 'CLOSE', 'MIGRATION', ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.PLUMBING_MIRROR_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_TRANSACTION_ID}, ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_DEBT_ENTRY_ID}, 'CLOSE', 'MIGRATION', ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.USER_CATEGORY_MIRROR_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.MANUAL_OPENING_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID}, NULL, NULL, 'OPEN', 'MANUAL', ${DebtV2LegacyShapeFixture.MANUAL_PRINCIPAL_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.MANUAL_PRINCIPAL_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}),
                (${DebtV2LegacyShapeFixture.MANUAL_CLOSING_EVENT_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID}, NULL, NULL, 'CLOSE', 'MANUAL', ${DebtV2LegacyShapeFixture.MANUAL_REPAID_AMOUNT}, 1, 1, ${DebtV2LegacyShapeFixture.MANUAL_REPAID_AMOUNT}, ${DebtV2LegacyShapeFixture.OPERATED_AT});
        `;
    }

    private buildAccountBalancesSql(): string {
        const timestamps = `${DebtV2LegacyShapeFixture.OPERATED_AT}, ${DebtV2LegacyShapeFixture.OPERATED_AT}`;

        return `
            INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
            VALUES
                (${DebtV2LegacyShapeFixture.USD_FUNDING_BALANCE_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.USD_FUNDING_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.USD_FUNDING_BALANCE_AMOUNT}),
                (${DebtV2LegacyShapeFixture.MANUAL_BALANCE_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MANUAL_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.MANUAL_PRINCIPAL_AMOUNT - DebtV2LegacyShapeFixture.MANUAL_REPAID_AMOUNT}),
                (${DebtV2LegacyShapeFixture.LENT_BALANCE_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.LENT_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.STALE_DEBT_BALANCE_AMOUNT}),
                (${DebtV2LegacyShapeFixture.BORROW_BALANCE_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.BORROW_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.STALE_DEBT_BALANCE_AMOUNT}),
                (${DebtV2LegacyShapeFixture.MIRROR_BALANCE_ID}, ${timestamps}, ${DebtV2LegacyShapeFixture.MIRROR_ACCOUNT_ID}, ${DebtV2LegacyShapeFixture.STALE_DEBT_BALANCE_AMOUNT});
        `;
    }
}
