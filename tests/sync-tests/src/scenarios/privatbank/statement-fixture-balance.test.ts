import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AccountRepository, ExternalSourceEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { parsePrivatbankXlsx, PrivatbankFileClient } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, fetchBalanceAdjustments, makeStubFileBankSyncService, TestLayer } from '../../harness';

const CARD = '4149 0000 0000 1234';

const importFixture = Effect.fnUntraced(function* (fileName: string) {
    const rows = yield* parsePrivatbankXlsx(readFileSync(resolve(process.cwd(), '../app-tests/fixtures/privatbank', fileName)));
    const service = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new PrivatbankFileClient(rows));

    yield* service.executeImportForSelectedAccounts(fileName, [CARD]);
    const [account] = yield* (yield* AccountRepository).findByExternalIds([CARD]);

    return account.id;
});

describe('privatbank/statement-fixture-balance', () => {
    it.effect('shows the statement balances the e2e import flow expects', () =>
        Effect.gen(function* () {
            const accountId = yield* importFixture('privatbank-statement-001.xlsx');

            expect(yield* fetchAccountBalance(accountId)).toBe(1_747_000_000);

            yield* importFixture('privatbank-statement-002.xlsx');
            expect(yield* fetchAccountBalance(accountId)).toBe(1_747_000_000);

            yield* importFixture('privatbank-statement-002.xlsx');
            expect(yield* fetchAccountBalance(accountId)).toBe(1_747_000_000);

            yield* (yield* AccountService).updateById(accountId, { currentBalance: 600 });
            const adjustmentAmounts = yield* fetchBalanceAdjustments(accountId);

            expect(yield* fetchAccountBalance(accountId)).toBe(600_000_000);
            expect(adjustmentAmounts.map(({ amount }) => amount).sort((left, right) => left - right)).toEqual([
                1_147_000_000, 1_200_000_000
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});
