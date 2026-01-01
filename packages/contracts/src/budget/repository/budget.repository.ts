import { eq } from 'drizzle-orm';

import { TX } from '../../@generic/type/db.type';
import * as schema from '../../schema';
import { BudgetCreateEntityInterface } from '../entity/budget-create-entity.interface';
import { BudgetUpdateEntityInterface } from '../entity/budget-update-entity.interface';
import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetEntityTable } from '../table/budget-entity.table';

import type { BudgetEntityInterface } from '../entity/budget-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class BudgetRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.BudgetEntityTable.findMany();
    }

    findActive() {
        return this.db.query.BudgetEntityTable.findMany({
            where: eq(BudgetEntityTable.status, BudgetStatusEnum.ACTIVE)
        });
    }

    findTemplates() {
        return this.db.query.BudgetEntityTable.findMany({
            where: eq(BudgetEntityTable.isTemplate, true)
        });
    }

    findById(id: number) {
        return this.db.query.BudgetEntityTable.findFirst({
            where: eq(BudgetEntityTable.id, id)
        });
    }

    findByIdWithRelations(id: number) {
        return this.db.query.BudgetEntityTable.findFirst({
            where: eq(BudgetEntityTable.id, id),
            with: {
                instrument: true,
                allocations: {
                    with: {
                        category: true
                    }
                }
            }
        });
    }

    async create(input: BudgetCreateEntityInterface, tx?: TX): Promise<BudgetEntityInterface> {
        const [budget] = await (tx ?? this.db).insert(BudgetEntityTable).values(input).returning();

        return budget;
    }

    async updateById(id: number, input: BudgetUpdateEntityInterface): Promise<BudgetEntityInterface> {
        const [budget] = await this.db
            .update(BudgetEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BudgetEntityTable.id, id))
            .returning();

        return budget;
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(BudgetEntityTable).where(eq(BudgetEntityTable.id, id));
    }

    async activate(id: number): Promise<BudgetEntityInterface> {
        return this.updateById(id, { status: BudgetStatusEnum.ACTIVE });
    }

    async archive(id: number): Promise<BudgetEntityInterface> {
        return this.updateById(id, { status: BudgetStatusEnum.ARCHIVED });
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(BudgetEntityTable);
    }
}

