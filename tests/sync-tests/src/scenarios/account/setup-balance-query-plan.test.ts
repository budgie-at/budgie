import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { AccountTypeEnum } from '@budgie/contracts';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, testDb } from '../../harness';

describe('account/setup-balance-query-plan', () => {
    it('looks up the Monobank setup balance through the unique sync-account index', () => {
        const account = seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        seed.sync({ accountId: account.id });
        const { sql: queryText, params } = accountBalanceRepository.getByAccountId(account.id).toSQL();
        const fragments = queryText
            .split('?')
            .flatMap((segment, index) => [sql.raw(segment), ...(index < params.length ? [sql`${params[index]}`] : [])]);

        const details = testDb
            .all<Record<'detail', string>>(sql`EXPLAIN QUERY PLAN ${sql.join(fragments, sql``)}`)
            .map(step => step.detail);

        expect(details.some(detail => detail.includes('SEARCH bank_syncs') && detail.includes('account_id'))).toBe(true);
        expect(details).not.toContain('SCAN bank_syncs');
    });
});
