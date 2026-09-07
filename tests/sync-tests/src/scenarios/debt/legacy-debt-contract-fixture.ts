import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import Database from 'better-sqlite3';

import { isDefined } from '@rnw-community/shared';

export class LegacyDebtContractFixture {
    static readonly LENT_ACCOUNT_ID = 300;
    static readonly BORROW_ACCOUNT_ID = 301;
    private static readonly PRINCIPAL_AMOUNT = 1_000_000_000;
    private static readonly SETTLED_AMOUNT = 250_000_000;
    private static readonly LENT_ADJUSTMENT_TRANSACTION_ID = 1300;
    private static readonly BORROW_ADJUSTMENT_TRANSACTION_ID = 1301;
    private static readonly LENT_ADJUSTMENT_ENTRY_ID = 2300;
    private static readonly BORROW_ADJUSTMENT_ENTRY_ID = 2301;

    private temporaryDirectoryPath: string | null = null;

    constructor(private readonly baseFixturePath: string) {}

    prepare(): string {
        this.temporaryDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-legacy-debt-contract-'));
        const preparedFixturePath = join(this.temporaryDirectoryPath, basename(this.baseFixturePath));
        copyFileSync(this.baseFixturePath, preparedFixturePath);

        const sqlite = new Database(preparedFixturePath);
        try {
            sqlite.exec(this.buildLegacyAccountsSql());
        } finally {
            sqlite.close();
        }

        return preparedFixturePath;
    }

    cleanup(): void {
        if (isDefined(this.temporaryDirectoryPath)) {
            rmSync(this.temporaryDirectoryPath, { recursive: true, force: true });
        }
    }

    private buildLegacyAccountsSql(): string {
        const outstandingAmount = LegacyDebtContractFixture.PRINCIPAL_AMOUNT - LegacyDebtContractFixture.SETTLED_AMOUNT;

        return `
            BEGIN;

            INSERT INTO accounts (id, icon, title, type, nature, debt_type, instrument_id, target_balance, include_in_net_worth, is_active, title_search)
            VALUES
                (${LegacyDebtContractFixture.LENT_ACCOUNT_ID}, 'HandCoins', 'Legacy lent debt', 'DEBT', 'ASSET', 'LENT', 1, ${LegacyDebtContractFixture.PRINCIPAL_AMOUNT}, 0, 1, 'legacy lent debt'),
                (${LegacyDebtContractFixture.BORROW_ACCOUNT_ID}, 'HandCoins', 'Legacy borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, ${LegacyDebtContractFixture.PRINCIPAL_AMOUNT}, 0, 1, 'legacy borrowed debt');

            INSERT INTO account_balances (id, account_id, amount)
            VALUES
                (${LegacyDebtContractFixture.LENT_ACCOUNT_ID}, ${LegacyDebtContractFixture.LENT_ACCOUNT_ID}, ${LegacyDebtContractFixture.SETTLED_AMOUNT}),
                (${LegacyDebtContractFixture.BORROW_ACCOUNT_ID}, ${LegacyDebtContractFixture.BORROW_ACCOUNT_ID}, ${-outstandingAmount});

            INSERT INTO transactions (id, type, title, to_account_id, from_account_id, exchange_rate)
            VALUES
                (${LegacyDebtContractFixture.LENT_ADJUSTMENT_TRANSACTION_ID}, 'ADJUSTMENT', 'Legacy lent settlement snapshot', ${LegacyDebtContractFixture.LENT_ACCOUNT_ID}, NULL, 1),
                (${LegacyDebtContractFixture.BORROW_ADJUSTMENT_TRANSACTION_ID}, 'ADJUSTMENT', 'Legacy borrowed settlement snapshot', ${LegacyDebtContractFixture.BORROW_ACCOUNT_ID}, NULL, 1);

            INSERT INTO transaction_entries (id, type, account_id, transaction_id, amount)
            VALUES
                (${LegacyDebtContractFixture.LENT_ADJUSTMENT_ENTRY_ID}, 'DEBIT', ${LegacyDebtContractFixture.LENT_ACCOUNT_ID}, ${LegacyDebtContractFixture.LENT_ADJUSTMENT_TRANSACTION_ID}, ${LegacyDebtContractFixture.SETTLED_AMOUNT}),
                (${LegacyDebtContractFixture.BORROW_ADJUSTMENT_ENTRY_ID}, 'CREDIT', ${LegacyDebtContractFixture.BORROW_ACCOUNT_ID}, ${LegacyDebtContractFixture.BORROW_ADJUSTMENT_TRANSACTION_ID}, ${LegacyDebtContractFixture.SETTLED_AMOUNT});

            COMMIT;
        `;
    }
}
