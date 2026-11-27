import { inArray } from 'drizzle-orm';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { MccCategoryCreateEntityInterface } from '../entity/mcc-category-create-entity.interface';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

export class MccCategoryRepository extends Context.Service<MccCategoryRepository>()('@budgie/contracts/MccCategoryRepository', {
    make: Effect.sync(() => {
        const bulkCreate = (inputs: MccCategoryCreateEntityInterface[]) =>
            Db.query(db => db.insert(MccCategoryEntityTable).values(inputs).returning());

        return {
            bulkCreate,
            create: Effect.fn('MccCategoryRepository.create')(function* (input: MccCategoryCreateEntityInterface) {
                const [mccCategory] = yield* bulkCreate([input]);

                return mccCategory;
            }),
            truncate: Db.query(db => db.delete(MccCategoryEntityTable)),
            findAll: Db.query(db => db.query.MccCategoryEntityTable.findMany()),
            findById: (id: number) => Db.query(db => db.query.MccCategoryEntityTable.findFirst({ where: { id } })),
            findMccCodesByIds: Effect.fn('MccCategoryRepository.findMccCodesByIds')(function* (ids: readonly number[]) {
                const codeMap = new Map<number, string>();

                if (!isNotEmptyArray(ids)) {
                    return codeMap;
                }

                for (const chunk of Arr.chunksOf(ids, 500)) {
                    const rows = yield* Db.query(db =>
                        db
                            .select({ id: MccCategoryEntityTable.id, mcc: MccCategoryEntityTable.mcc })
                            .from(MccCategoryEntityTable)
                            .where(inArray(MccCategoryEntityTable.id, chunk))
                    );

                    for (const row of rows) {
                        codeMap.set(row.id, row.mcc);
                    }
                }

                return codeMap;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(MccCategoryRepository, MccCategoryRepository.make);
}
