import { desc, eq, isNull } from 'drizzle-orm';

import { BudgetTemplateEntityTable } from '../table/budget-template-entity.table';

import type { DB, TX } from '../../@generic/type/db.type';
import type { BudgetTemplateCreateEntityInterface } from '../entity/budget-template-create-entity.interface';
import type { BudgetTemplateEntityInterface } from '../entity/budget-template-entity.interface';

export class BudgetTemplateRepository {
    constructor(private db: DB) {}

    findAll(transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetTemplateEntityTable.findMany({
            where: isNull(BudgetTemplateEntityTable.deletedAt),
            orderBy: [desc(BudgetTemplateEntityTable.createdAt)]
        });
    }

    findById(id: number, transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetTemplateEntityTable.findFirst({
            where: (table, { and, eq: eqOp }) => and(eqOp(table.id, id), isNull(table.deletedAt))
        });
    }

    findByName(name: string, transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetTemplateEntityTable.findFirst({
            where: (table, { and, eq: eqOp }) => and(eqOp(table.name, name), isNull(table.deletedAt))
        });
    }

    async create(input: BudgetTemplateCreateEntityInterface, transaction?: TX): Promise<BudgetTemplateEntityInterface> {
        const database = transaction ?? this.db;
        const [template] = await database.insert(BudgetTemplateEntityTable).values(input).returning();

        return template;
    }

    async deleteById(id: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.update(BudgetTemplateEntityTable).set({ deletedAt: new Date() }).where(eq(BudgetTemplateEntityTable.id, id));
    }
}
