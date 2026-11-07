import { Db, PERSONAL_SYNC_ZONE, SyncRecordTypeEnum } from '@budgie/contracts';
import { getTableColumns } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import { makeHouseholdQueries } from '../utils/make-household-queries.util';

import { HouseholdLabelRepository } from './household-label.repository';

import type { HouseholdAlignmentEntryInterface } from '../interface/household-alignment-entry.interface';
import type { HouseholdAlignmentTagInterface } from '../interface/household-alignment-tag.interface';
import type { HouseholdRowIdentityInterface } from '../interface/household-row-identity.interface';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

const CHUNK_SIZE = 400;
const placeholders = (values: readonly unknown[]): string => values.map(() => '?').join(', ');

const chunked = <T>(values: readonly T[]): readonly (readonly T[])[] =>
    Array.from({ length: Math.ceil(values.length / CHUNK_SIZE) }, (_, index) => values.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE));

export class HouseholdShareRepository extends Context.Service<HouseholdShareRepository>()('@budgie/cloud-sync/HouseholdShareRepository', {
    make: Effect.gen(function* () {
        const labels = yield* HouseholdLabelRepository;
        const { select, execute } = makeHouseholdQueries();

        const selectChunked = <T extends object>(
            ids: readonly number[],
            build: (marks: string) => string,
            params: readonly (string | number)[] = []
        ) =>
            Effect.forEach(chunked(ids), chunk => select<T>(build(placeholders(chunk)), [...params, ...chunk])).pipe(
                Effect.map(parts => parts.flat())
            );

        const executeChunked = (
            tables: readonly string[],
            ids: readonly number[],
            build: (marks: string) => string,
            params: readonly (string | number | null)[] = []
        ) => Effect.forEach(chunked(ids), chunk => execute(tables, build(placeholders(chunk)), [...params, ...chunk]), { discard: true });

        const findFamilyAccountIds = (accountIds: readonly number[]) =>
            isEmptyArray(accountIds)
                ? Effect.succeed<readonly number[]>([])
                : select<{ readonly id: number }>(
                      `WITH RECURSIVE family(id) AS (
                          SELECT id FROM accounts WHERE id IN (${placeholders(accountIds)})
                          UNION
                          SELECT a.parent_id FROM accounts a INNER JOIN family f ON a.id = f.id WHERE a.parent_id IS NOT NULL
                          UNION
                          SELECT a.id FROM accounts a INNER JOIN family f ON a.parent_id = f.id
                      ) SELECT id FROM family`,
                      accountIds
                  ).pipe(Effect.map(rows => rows.map(({ id }) => id)));

        return {
            ...labels,
            findFamilyAccountIds,
            cloneRow: Effect.fn('HouseholdShareRepository.cloneRow')(function* (
                table: SQLiteTable,
                tableName: string,
                sourceId: number,
                overrides: Readonly<Record<string, string | number | null>>
            ) {
                const columnNames = Object.values(getTableColumns(table))
                    .map(column => column.name)
                    .filter(name => name !== 'id');
                const overrideNames = new Set(Object.keys(overrides));
                const selectList = columnNames.map(name => (overrideNames.has(name) ? '?' : `"${name}"`)).join(', ');
                const overrideValues = columnNames.filter(name => overrideNames.has(name)).map(name => overrides[name]);
                const rows = yield* Db.mutation(
                    { type: 'insert', tables: [tableName] },
                    Db.query(db =>
                        db.$client.unsafe<{ readonly id: number }>(
                            `INSERT INTO "${tableName}" (${columnNames.map(name => `"${name}"`).join(', ')})
                SELECT ${selectList} FROM "${tableName}" WHERE id = ? RETURNING id`,
                            [...overrideValues, sourceId]
                        )
                    )
                );

                return rows[0].id;
            }),
            findAccounts: (accountIds: readonly number[]) =>
                selectChunked<HouseholdRowIdentityInterface & { readonly integrationId: number | null }>(
                    accountIds,
                    marks =>
                        `SELECT id, sync_id AS syncId, sync_zone AS syncZone, integration_id AS integrationId FROM accounts WHERE id IN (${marks})`
                ),
            findPersonalAccountIds: select<{ readonly id: number }>(`SELECT id FROM accounts WHERE sync_zone = ? ORDER BY id`, [
                PERSONAL_SYNC_ZONE
            ]).pipe(Effect.map(rows => rows.map(({ id }) => id))),
            setZone: (tableName: string, ids: readonly number[], zone: string) =>
                executeChunked([tableName], ids, marks => `UPDATE "${tableName}" SET sync_zone = ? WHERE id IN (${marks})`, [zone]),
            setChildZone: (childTable: string, parentColumn: string, parentIds: readonly number[], zone: string) =>
                executeChunked(
                    [childTable],
                    parentIds,
                    marks => `UPDATE "${childTable}" SET sync_zone = ? WHERE "${parentColumn}" IN (${marks})`,
                    [zone]
                ),
            countOtherAccountsOnIntegration: (integrationId: number, excludedAccountIds: readonly number[], zone: string) =>
                select<{ readonly total: number }>(
                    `SELECT COUNT(*) AS total FROM accounts WHERE integration_id = ? AND sync_zone = ? AND id NOT IN (${placeholders(excludedAccountIds)})`,
                    [integrationId, zone, ...excludedAccountIds]
                ).pipe(Effect.map(([row]) => row.total)),
            findIntegration: (integrationId: number) =>
                select<HouseholdRowIdentityInterface>(
                    `SELECT id, sync_id AS syncId, sync_zone AS syncZone FROM bank_integrations WHERE id = ?`,
                    [integrationId]
                ).pipe(Effect.map(rows => rows.at(0) ?? null)),
            findTransactionIdsOnAccounts: (accountIds: readonly number[]) =>
                selectChunked<{ readonly id: number }>(
                    accountIds,
                    marks => `SELECT DISTINCT transaction_id AS id FROM transaction_entries WHERE account_id IN (${marks})`
                ).pipe(Effect.map(rows => [...new Set(rows.map(({ id }) => id))])),
            findMisalignedTransactionIds: select<{ readonly id: number }>(
                `SELECT DISTINCT e.transaction_id AS id
                    FROM accounts a
                    INNER JOIN transaction_entries e ON e.account_id = a.id
                    LEFT JOIN categories c ON c.id = e.category_id
                    WHERE a.sync_zone <> ? AND (e.sync_zone <> a.sync_zone OR (c.id IS NOT NULL AND c.sync_zone <> a.sync_zone))
                    UNION
                    SELECT DISTINCT t.id
                    FROM transactions t
                    INNER JOIN transaction_tags tt ON tt.transaction_id = t.id
                    INNER JOIN tags g ON g.id = tt.tag_id
                    WHERE t.sync_zone <> ? AND g.sync_zone <> t.sync_zone`,
                [PERSONAL_SYNC_ZONE, PERSONAL_SYNC_ZONE]
            ).pipe(Effect.map(rows => rows.map(({ id }) => id))),
            findAlignmentEntries: (transactionIds: readonly number[]) =>
                selectChunked<HouseholdAlignmentEntryInterface>(
                    transactionIds,
                    marks => `SELECT t.id AS transactionId, t.sync_id AS transactionSyncId, t.sync_zone AS transactionZone,
                        e.id AS entryId, e.sync_zone AS entryZone, a.sync_zone AS accountZone,
                        e.category_id AS categoryId, c.sync_zone AS categoryZone
                    FROM transactions t
                    INNER JOIN transaction_entries e ON e.transaction_id = t.id
                    INNER JOIN accounts a ON a.id = e.account_id
                    LEFT JOIN categories c ON c.id = e.category_id
                    WHERE t.id IN (${marks})`
                ),
            findAlignmentTags: (transactionIds: readonly number[]) =>
                selectChunked<HouseholdAlignmentTagInterface>(
                    transactionIds,
                    marks => `SELECT tt.transaction_id AS transactionId, tt.rowid AS rowId, tt.tag_id AS tagId, g.sync_zone AS tagZone, tt.sync_zone AS rowZone
                    FROM transaction_tags tt INNER JOIN tags g ON g.id = tt.tag_id WHERE tt.transaction_id IN (${marks})`
                ),
            setEntryZone: (entryIds: readonly number[], zone: string) =>
                executeChunked(
                    ['transaction_entries'],
                    entryIds,
                    marks => `UPDATE transaction_entries SET sync_zone = ? WHERE id IN (${marks})`,
                    [zone]
                ),
            setEntryCategory: (entryId: number, categoryId: number) =>
                execute(['transaction_entries'], `UPDATE transaction_entries SET category_id = ? WHERE id = ?`, [categoryId, entryId]),
            setTransactionChildrenZone: (transactionId: number, zone: string) =>
                Effect.all(
                    [
                        execute(['transactions'], `UPDATE transactions SET sync_zone = ? WHERE id = ?`, [zone, transactionId]),
                        execute(['transaction_tags'], `UPDATE transaction_tags SET sync_zone = ? WHERE transaction_id = ?`, [
                            zone,
                            transactionId
                        ]),
                        execute(['transaction_receipts'], `UPDATE transaction_receipts SET sync_zone = ? WHERE transaction_id = ?`, [
                            zone,
                            transactionId
                        ])
                    ],
                    { discard: true }
                ),
            setTransactionTag: (rowId: number, tagId: number, zone: string) =>
                execute(['transaction_tags'], `UPDATE OR REPLACE transaction_tags SET tag_id = ?, sync_zone = ? WHERE rowid = ?`, [
                    tagId,
                    zone,
                    rowId
                ]),
            findDebtEventsOnAccounts: (accountIds: readonly number[], zone: string) =>
                selectChunked<HouseholdRowIdentityInterface>(
                    accountIds,
                    marks =>
                        `SELECT id, sync_id AS syncId, sync_zone AS syncZone FROM debt_events WHERE sync_zone = ? AND debt_account_id IN (${marks})`,
                    [zone]
                ),
            findRulesOnAccounts: (accountIds: readonly number[], zone: string) =>
                selectChunked<HouseholdRowIdentityInterface>(
                    accountIds,
                    marks => `SELECT DISTINCT r.id AS id, r.sync_id AS syncId, r.sync_zone AS syncZone
                    FROM rules r INNER JOIN rule_actions ra ON ra.rule_id = r.id WHERE r.sync_zone = ? AND ra.account_id IN (${marks})`,
                    [zone]
                ),
            findRuleActionReferences: (ruleId: number) =>
                select<{ readonly id: number; readonly categoryId: number | null; readonly tagId: number | null }>(
                    `SELECT id, category_id AS categoryId, tag_id AS tagId FROM rule_actions WHERE rule_id = ?`,
                    [ruleId]
                ),
            setRuleActionReferences: (actionId: number, categoryId: number | null, tagId: number | null) =>
                execute(['rule_actions'], `UPDATE rule_actions SET category_id = ?, tag_id = ? WHERE id = ?`, [
                    categoryId,
                    tagId,
                    actionId
                ]),
            findBudget: (budgetId: number) =>
                select<HouseholdRowIdentityInterface & { readonly tagId: number | null }>(
                    `SELECT id, sync_id AS syncId, sync_zone AS syncZone, tag_id AS tagId FROM budgets WHERE id = ?`,
                    [budgetId]
                ).pipe(Effect.map(rows => rows.at(0) ?? null)),
            setBudgetTag: (budgetId: number, tagId: number | null) =>
                execute(['budgets'], `UPDATE budgets SET tag_id = ? WHERE id = ?`, [tagId, budgetId]),
            findBudgetCategoryReferences: (budgetId: number) =>
                select<{
                    readonly tableName: string;
                    readonly id: number;
                    readonly categoryId: number | null;
                    readonly seriesId: number | null;
                }>(
                    `SELECT 'budget_category_limits' AS tableName, id, category_id AS categoryId, NULL AS seriesId FROM budget_category_limits WHERE budget_id = ?
                    UNION ALL SELECT 'budget_limit_changes', id, category_id, NULL FROM budget_limit_changes WHERE budget_id = ?
                    UNION ALL SELECT 'budget_sinking_funds', id, category_id, recurring_series_id FROM budget_sinking_funds WHERE budget_id = ?`,
                    [budgetId, budgetId, budgetId]
                ),
            setBudgetChildCategory: (tableName: string, id: number, categoryId: number | null) =>
                execute([tableName], `UPDATE OR IGNORE "${tableName}" SET category_id = ? WHERE id = ?`, [categoryId, id]),
            findRecurringSeries: (seriesId: number) =>
                select<HouseholdRowIdentityInterface & { readonly categoryId: number | null }>(
                    `SELECT id, sync_id AS syncId, sync_zone AS syncZone, category_id AS categoryId FROM recurring_series WHERE id = ?`,
                    [seriesId]
                ).pipe(Effect.map(rows => rows.at(0) ?? null)),
            setSeriesCategory: (seriesId: number, categoryId: number | null) =>
                execute(['recurring_series'], `UPDATE recurring_series SET category_id = ? WHERE id = ?`, [categoryId, seriesId]),
            findPrivateSideOwnerName: (syncZone: string, syncId: string) =>
                select<{ readonly ownerName: string | null }>(
                    `SELECT json_extract(payload, '$.encryptedFields.privateOwnerName') AS ownerName FROM sync_record
                    WHERE sync_zone = ? AND sync_id = ? AND record_type = ? LIMIT 1`,
                    [syncZone, syncId, SyncRecordTypeEnum.TRANSACTION_LEG]
                ).pipe(Effect.map(rows => rows.at(0)?.ownerName ?? null)),
            findShareEverything: select<{ readonly isEnabled: number }>(
                `SELECT household_share_everything AS isEnabled FROM settings ORDER BY id LIMIT 1`
            ).pipe(Effect.map(rows => (rows.at(0)?.isEnabled ?? 0) === 1)),
            setShareEverything: (isEnabled: boolean) =>
                execute(['settings'], `UPDATE settings SET household_share_everything = ?`, [isEnabled ? 1 : 0]),
            findAccountIdsSharedByThisUser: (householdZone: string) =>
                select<{ readonly id: number }>(
                    `SELECT a.id AS id FROM accounts a
                    WHERE a.sync_zone = ? AND (
                        EXISTS (SELECT 1 FROM sync_record r WHERE r.sync_zone = ? AND r.sync_id = a.sync_id AND r.record_type = ?)
                        OR EXISTS (SELECT 1 FROM sync_outbox o WHERE o.sync_zone = ? AND o.sync_id = a.sync_id AND o.record_type = ?)
                    )`,
                    [householdZone, PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.ACCOUNT, PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.ACCOUNT]
                ).pipe(Effect.map(rows => rows.map(({ id }) => id))),
            findBudgetIdsSharedByThisUser: (householdZone: string) =>
                select<{ readonly id: number }>(
                    `SELECT b.id AS id FROM budgets b
                    WHERE b.sync_zone = ? AND (
                        EXISTS (SELECT 1 FROM sync_record r WHERE r.sync_zone = ? AND r.sync_id = b.sync_id AND r.record_type = ?)
                        OR EXISTS (SELECT 1 FROM sync_outbox o WHERE o.sync_zone = ? AND o.sync_id = b.sync_id AND o.record_type = ?)
                    )`,
                    [householdZone, PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.BUDGET, PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.BUDGET]
                ).pipe(Effect.map(rows => rows.map(({ id }) => id)))
        };
    })
}) {
    static readonly layer = Layer.effect(HouseholdShareRepository, HouseholdShareRepository.make).pipe(
        Layer.provide(HouseholdLabelRepository.layer)
    );
}
