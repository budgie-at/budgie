import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import Database from 'better-sqlite3';
import { expect } from 'vitest';

import { isNumber } from '@rnw-community/shared';

export class LegacyDebtFixtureShape {
    private static readonly EXPECTED_ADJUSTMENT_AMOUNT = 1_000;
    private static readonly EXPECTED_LEGACY_BALANCE = -LegacyDebtFixtureShape.EXPECTED_ADJUSTMENT_AMOUNT;

    constructor(private readonly fixturePath: string) {}

    assert(): void {
        const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-legacy-debt-fixture-'));
        const temporaryFixturePath = join(temporaryDirectoryPath, basename(this.fixturePath));
        copyFileSync(this.fixturePath, temporaryFixturePath);
        const sqlite = new Database(temporaryFixturePath, { readonly: true });

        try {
            expect(convertFromMicroUnits(this.getNumber(sqlite, 'SELECT amount FROM account_balances WHERE account_id = 102'))).toBe(
                LegacyDebtFixtureShape.EXPECTED_LEGACY_BALANCE
            );
            expect(
                convertFromMicroUnits(
                    this.getNumber(
                        sqlite,
                        "SELECT amount FROM transaction_entries WHERE transaction_id = 1010 AND account_id = 102 AND type = 'CREDIT'"
                    )
                )
            ).toBe(LegacyDebtFixtureShape.EXPECTED_ADJUSTMENT_AMOUNT);
            expect(
                this.getNumber(sqlite, "SELECT COUNT(*) FROM transactions WHERE id = 1010 AND type = 'ADJUSTMENT' AND to_account_id = 102")
            ).toBe(1);
            expect(
                this.getNumber(
                    sqlite,
                    "SELECT COUNT(*) FROM transactions INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id WHERE transactions.type = 'DEBT' AND transaction_entries.account_id = 102"
                )
            ).toBe(0);
        } finally {
            sqlite.close();
            rmSync(temporaryDirectoryPath, { recursive: true, force: true });
        }
    }

    private getNumber(sqlite: Database.Database, sqlText: string): number {
        const value = sqlite.prepare(sqlText).pluck().get();

        if (!isNumber(value)) {
            throw new Error('Legacy fixture query did not return a number');
        }

        return value;
    }
}
