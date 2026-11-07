import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { HOUSEHOLD_LABEL_REFERENCES } from '../constant/household-label-references.constant';
import { makeHouseholdQueries } from '../utils/make-household-queries.util';

import type { HouseholdLabeledRowInterface } from '../interface/household-labeled-row.interface';

export class HouseholdLabelRepository extends Context.Service<HouseholdLabelRepository>()('@budgie/cloud-sync/HouseholdLabelRepository', {
    make: Effect.sync(() => {
        const { select, execute } = makeHouseholdQueries();

        return {
            findLabeledRow: (tableName: string, id: number) =>
                select<HouseholdLabeledRowInterface>(
                    `SELECT id, sync_id AS syncId, sync_zone AS syncZone, ${tableName === 'categories' ? 'parent_id' : 'NULL'} AS parentId, ${tableName === 'categories' ? 'is_default' : '0'} AS isDefault, title
                    FROM "${tableName}" WHERE id = ?`,
                    [id]
                ).pipe(Effect.map(rows => rows.at(0) ?? null)),
            findLabeledIdsInZone: (tableName: string, zone: string) =>
                select<{ readonly id: number }>(`SELECT id FROM "${tableName}" WHERE sync_zone = ? ORDER BY id`, [zone]).pipe(
                    Effect.map(rows => rows.map(({ id }) => id))
                ),
            repointLabelReferences: (tableName: string, fromId: number, toId: number) =>
                Effect.forEach(
                    HOUSEHOLD_LABEL_REFERENCES[tableName] ?? [],
                    ([referencingTable, column]) =>
                        execute([referencingTable], `UPDATE OR IGNORE "${referencingTable}" SET ${column} = ? WHERE ${column} = ?`, [
                            toId,
                            fromId
                        ]),
                    { discard: true }
                ),
            findIdByIdentity: (tableName: string, zone: string, syncId: string) =>
                select<{ readonly id: number }>(`SELECT id FROM "${tableName}" WHERE sync_zone = ? AND sync_id = ? LIMIT 1`, [
                    zone,
                    syncId
                ]).pipe(Effect.map(rows => rows.at(0)?.id ?? null)),
            findIdByTitle: (tableName: string, zone: string, title: string) =>
                select<{ readonly id: number }>(
                    `SELECT id FROM "${tableName}" WHERE sync_zone = ? AND title = ? AND deleted_at IS NULL${tableName === 'categories' ? ' AND is_default = 0' : ''} ORDER BY id LIMIT 1`,
                    [zone, title]
                ).pipe(Effect.map(rows => rows.at(0)?.id ?? null)),
            setCategoryParent: (categoryId: number, parentId: number | null) =>
                execute(['categories'], `UPDATE categories SET parent_id = ? WHERE id = ?`, [parentId, categoryId]),
            copyCategoryTranslations: (fromCategoryId: number, toCategoryId: number) =>
                execute(
                    ['default_category_translations'],
                    `INSERT OR IGNORE INTO default_category_translations (category_id, language, title)
                    SELECT ?, language, title FROM default_category_translations WHERE category_id = ?`,
                    [toCategoryId, fromCategoryId]
                )
        };
    })
}) {
    static readonly layer = Layer.effect(HouseholdLabelRepository, HouseholdLabelRepository.make);
}
