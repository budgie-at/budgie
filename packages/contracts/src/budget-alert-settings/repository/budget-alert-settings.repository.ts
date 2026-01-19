import { eq } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { BudgetAlertSettingsCreateEntityInterface } from '../entity/budget-alert-settings-create-entity.interface';
import { BudgetAlertSettingsEntityInterface } from '../entity/budget-alert-settings-entity.interface';
import { BudgetAlertSettingsEntityTable } from '../table/budget-alert-settings-entity.table';

export class BudgetAlertSettingsRepository {
    constructor(private db: DB) {}

    findByBudgetId(budgetId: number): Promise<BudgetAlertSettingsEntityInterface | undefined> {
        return this.db.query.BudgetAlertSettingsEntityTable.findFirst({
            where: eq(BudgetAlertSettingsEntityTable.budgetId, budgetId)
        });
    }

    async create(input: BudgetAlertSettingsCreateEntityInterface, transaction?: TX): Promise<BudgetAlertSettingsEntityInterface> {
        const database = transaction ?? this.db;
        const [settings] = await database.insert(BudgetAlertSettingsEntityTable).values(input).returning();

        return settings;
    }

    async updateByBudgetId(
        budgetId: number,
        input: Partial<BudgetAlertSettingsCreateEntityInterface>,
        transaction?: TX
    ): Promise<BudgetAlertSettingsEntityInterface> {
        const database = transaction ?? this.db;
        const [settings] = await database
            .update(BudgetAlertSettingsEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BudgetAlertSettingsEntityTable.budgetId, budgetId))
            .returning();

        return settings;
    }

    async upsert(
        budgetId: number,
        input: Omit<BudgetAlertSettingsCreateEntityInterface, 'budgetId'>,
        transaction?: TX
    ): Promise<BudgetAlertSettingsEntityInterface> {
        const database = transaction ?? this.db;
        const [settings] = await database
            .insert(BudgetAlertSettingsEntityTable)
            .values({ ...input, budgetId })
            .onConflictDoUpdate({
                target: BudgetAlertSettingsEntityTable.budgetId,
                set: { ...input, updatedAt: new Date() }
            })
            .returning();

        return settings;
    }

    async deleteByBudgetId(budgetId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetAlertSettingsEntityTable).where(eq(BudgetAlertSettingsEntityTable.budgetId, budgetId));
    }
}
