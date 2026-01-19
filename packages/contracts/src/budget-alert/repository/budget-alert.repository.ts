import { and, eq, isNull } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { BudgetAlertCreateEntityInterface } from '../entity/budget-alert-create-entity.interface';
import { BudgetAlertEntityInterface } from '../entity/budget-alert-entity.interface';
import { BudgetAlertEntityTable } from '../table/budget-alert-entity.table';

export class BudgetAlertRepository {
    constructor(private db: DB) {}

    findByBudgetId(budgetId: number, transaction?: TX): Promise<BudgetAlertEntityInterface[]> {
        const database = transaction ?? this.db;

        return database.query.BudgetAlertEntityTable.findMany({
            where: eq(BudgetAlertEntityTable.budgetId, budgetId)
        });
    }

    findActiveByBudgetId(budgetId: number, periodStart: Date, transaction?: TX): Promise<BudgetAlertEntityInterface[]> {
        const database = transaction ?? this.db;

        return database.query.BudgetAlertEntityTable.findMany({
            where: and(
                eq(BudgetAlertEntityTable.budgetId, budgetId),
                eq(BudgetAlertEntityTable.periodStart, periodStart),
                isNull(BudgetAlertEntityTable.dismissedAt)
            )
        });
    }

    async create(input: BudgetAlertCreateEntityInterface, transaction?: TX): Promise<BudgetAlertEntityInterface> {
        const database = transaction ?? this.db;
        const [alert] = await database.insert(BudgetAlertEntityTable).values(input).returning();

        return alert;
    }

    async dismiss(id: number, transaction?: TX): Promise<BudgetAlertEntityInterface> {
        const database = transaction ?? this.db;
        const [alert] = await database
            .update(BudgetAlertEntityTable)
            .set({ dismissedAt: new Date(), updatedAt: new Date() })
            .where(eq(BudgetAlertEntityTable.id, id))
            .returning();

        return alert;
    }

    async dismissAllForPeriod(budgetId: number, periodStart: Date, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database
            .update(BudgetAlertEntityTable)
            .set({ dismissedAt: new Date(), updatedAt: new Date() })
            .where(
                and(
                    eq(BudgetAlertEntityTable.budgetId, budgetId),
                    eq(BudgetAlertEntityTable.periodStart, periodStart),
                    isNull(BudgetAlertEntityTable.dismissedAt)
                )
            );
    }
}
