import { eq } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { DB, TX } from '../../@generic/type/db.type';
import { AccountBudgetExclusionEntityInterface } from '../entity/account-budget-exclusion-entity.interface';
import { AccountBudgetExclusionEntityTable } from '../table/account-budget-exclusion-entity.table';

export class AccountBudgetExclusionRepository {
    constructor(private db: DB) {}

    async getAll(): Promise<AccountBudgetExclusionEntityInterface[]> {
        return this.db.query.AccountBudgetExclusionEntityTable.findMany();
    }

    findAll() {
        return this.db.query.AccountBudgetExclusionEntityTable.findMany();
    }

    async getExcludedAccountIds(): Promise<number[]> {
        const exclusions = await this.getAll();

        return exclusions.map(exclusion => exclusion.accountId);
    }

    async isExcluded(accountId: number): Promise<boolean> {
        const exclusion = await this.db.query.AccountBudgetExclusionEntityTable.findFirst({
            where: eq(AccountBudgetExclusionEntityTable.accountId, accountId)
        });

        return isDefined(exclusion);
    }

    async exclude(accountId: number, transaction?: TX): Promise<AccountBudgetExclusionEntityInterface> {
        const database = transaction ?? this.db;
        const [exclusion] = await database
            .insert(AccountBudgetExclusionEntityTable)
            .values({ accountId })
            .onConflictDoNothing()
            .returning();

        return exclusion;
    }

    async include(accountId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(AccountBudgetExclusionEntityTable).where(eq(AccountBudgetExclusionEntityTable.accountId, accountId));
    }
}
