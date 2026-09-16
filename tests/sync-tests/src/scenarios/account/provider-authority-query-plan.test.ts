import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { AccountTypeEnum, ExternalSourceEnum, SyncBalanceAuthorityEnum } from '@budgie/contracts';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, testDb } from '../../harness';

interface QueryPlanStepInterface {
    readonly detail: string;
}

interface ToSqlQueryInterface {
    readonly toSQL: () => { readonly sql: string; readonly params: readonly unknown[] };
}

const explainQueryPlan = (query: ToSqlQueryInterface): QueryPlanStepInterface[] => {
    const { sql: queryText, params } = query.toSQL();
    const segments = queryText.split('?').map(segment => sql.raw(segment));
    const fragments = segments.flatMap((segment, index) => (index < params.length ? [segment, sql`${params[index]}`] : [segment]));

    return testDb.all<QueryPlanStepInterface>(sql`EXPLAIN QUERY PLAN ${sql.join(fragments, sql``)}`);
};

const expectIndexedProviderAuthorityLookup = (query: ToSqlQueryInterface): void => {
    const details = explainQueryPlan(query).map(step => step.detail);

    expect(details.some(detail => detail.includes('SEARCH bank_syncs') && detail.includes('account_id'))).toBe(true);
    expect(details.some(detail => detail === 'SCAN bank_syncs')).toBe(false);
};

describe('account/provider-authority-query-plan', () => {
    it('uses the unique sync-account index for every provider-authority balance lookup', () => {
        const account = seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        seed.sync({ accountId: account.id, balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER });

        expectIndexedProviderAuthorityLookup(accountBalanceRepository.getByAccountId(account.id));
        expectIndexedProviderAuthorityLookup(accountBalanceRepository.getHomeAccountRows(1));
        expectIndexedProviderAuthorityLookup(accountBalanceRepository.getTotalByBankProvider(1, ExternalSourceEnum.MONOBANK));
        expectIndexedProviderAuthorityLookup(accountBalanceRepository.getTotalByAccountType(1, AccountTypeEnum.BANK_SYNC));
        expectIndexedProviderAuthorityLookup(accountBalanceRepository.getNetWorth(1));
    });
});
