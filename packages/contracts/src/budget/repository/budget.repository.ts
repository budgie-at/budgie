import { desc, eq } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { BudgetCreateEntityInterface } from '../entity/budget-create-entity.interface';
import { BudgetEntityInterface } from '../entity/budget-entity.interface';
import { BudgetUpdateEntityInterface } from '../entity/budget-update-entity.interface';
import { BudgetEntityTable } from '../table/budget-entity.table';

export class BudgetRepository {
    constructor(private db: DB) {}

    findActive() {
        return this.db.query.BudgetEntityTable.findFirst({
            with: {
                categoryLimits: {
                    with: {
                        category: true
                    }
                },
                incomeExpectations: {
                    with: {
                        category: true
                    }
                }
            },
            orderBy: [desc(BudgetEntityTable.createdAt)]
        });
    }

    findById(id: number, transaction?: TX) {
        const database = transaction ?? this.db;

        return database.query.BudgetEntityTable.findFirst({
            where: eq(BudgetEntityTable.id, id),
            with: {
                categoryLimits: {
                    with: {
                        category: true
                    }
                },
                incomeExpectations: {
                    with: {
                        category: true
                    }
                }
            }
        });
    }

    async getById(id: number, transaction?: TX): Promise<BudgetEntityInterface | undefined> {
        return this.findById(id, transaction);
    }

    async create(input: BudgetCreateEntityInterface, transaction?: TX): Promise<BudgetEntityInterface> {
        const database = transaction ?? this.db;
        const [budget] = await database.insert(BudgetEntityTable).values(input).returning();

        return budget;
    }

    async updateById(id: number, input: BudgetUpdateEntityInterface, transaction?: TX): Promise<BudgetEntityInterface> {
        const database = transaction ?? this.db;
        const [budget] = await database
            .update(BudgetEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BudgetEntityTable.id, id))
            .returning();

        return budget;
    }

    async deleteById(id: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetEntityTable).where(eq(BudgetEntityTable.id, id));
    }
}
