import { eq } from 'drizzle-orm';

import { DB } from '../../@generic/type/db.type';
import { MccGroupCreateEntityInterface } from '../entity/mcc-group-create-entity.interface';
import { MccGroupEntityInterface } from '../entity/mcc-group-entity.interface';
import { MccGroupEntityTable } from '../table/mcc-group-entity.table';

export class MccGroupRepository {
    constructor(private db: DB) {}

    findAll() {
        return this.db.query.MccGroupEntityTable.findMany();
    }

    findByType(type: string) {
        return this.db.query.MccGroupEntityTable.findFirst({
            where: eq(MccGroupEntityTable.type, type)
        });
    }

    async create(input: MccGroupCreateEntityInterface, tx?: DB): Promise<MccGroupEntityInterface> {
        const [mccGroup] = await this.bulkCreate([input], tx);

        return mccGroup;
    }

    async bulkCreate(inputs: MccGroupCreateEntityInterface[], tx?: DB): Promise<MccGroupEntityInterface[]> {
        return await (tx ?? this.db).insert(MccGroupEntityTable).values(inputs).returning();
    }

    async upsert(input: MccGroupCreateEntityInterface, tx?: DB): Promise<MccGroupEntityInterface> {
        const [mccGroup] = await (tx ?? this.db)
            .insert(MccGroupEntityTable)
            .values(input)
            .onConflictDoUpdate({
                target: MccGroupEntityTable.type,
                set: {
                    description: input.description
                }
            })
            .returning();

        return mccGroup;
    }

    async deleteByType(type: string): Promise<void> {
        await this.db.delete(MccGroupEntityTable).where(eq(MccGroupEntityTable.type, type));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(MccGroupEntityTable);
    }
}
