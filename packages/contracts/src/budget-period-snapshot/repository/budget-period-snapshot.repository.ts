import { desc, eq } from 'drizzle-orm';

import { BudgetPeriodSnapshotEntityTable } from '../table/budget-period-snapshot-entity.table';

import type { DB, TX } from '../../@generic/type/db.type';
import type { BudgetPeriodSnapshotCreateEntityInterface } from '../entity/budget-period-snapshot-create-entity.interface';
import type { BudgetPeriodSnapshotEntityInterface } from '../entity/budget-period-snapshot-entity.interface';

export class BudgetPeriodSnapshotRepository {
    constructor(private db: DB) {}

    findByBudgetId(budgetId: number, transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetPeriodSnapshotEntityTable.findMany({
            where: eq(BudgetPeriodSnapshotEntityTable.budgetId, budgetId),
            orderBy: [desc(BudgetPeriodSnapshotEntityTable.periodStart)]
        });
    }

    findByBudgetIdLimited(budgetId: number, limit: number, transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetPeriodSnapshotEntityTable.findMany({
            where: eq(BudgetPeriodSnapshotEntityTable.budgetId, budgetId),
            orderBy: [desc(BudgetPeriodSnapshotEntityTable.periodStart)],
            limit
        });
    }

    findByPeriodStart(budgetId: number, periodStart: Date, transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetPeriodSnapshotEntityTable.findFirst({
            where: (table, { and, eq: eqOp }) => and(eqOp(table.budgetId, budgetId), eqOp(table.periodStart, periodStart))
        });
    }

    async create(input: BudgetPeriodSnapshotCreateEntityInterface, transaction?: TX): Promise<BudgetPeriodSnapshotEntityInterface> {
        const database = transaction ?? this.db;
        const [snapshot] = await database.insert(BudgetPeriodSnapshotEntityTable).values(input).returning();

        return snapshot;
    }

    async deleteByBudgetId(budgetId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetPeriodSnapshotEntityTable).where(eq(BudgetPeriodSnapshotEntityTable.budgetId, budgetId));
    }
}
