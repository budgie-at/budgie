import {
    YIELD_TO_UI,
    Db,
    CategoryEntityTable,
    TagEntityTable,
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    SyncOutboxOperationEnum,
    SyncRecordTypeEnum,
    SyncApplyStateRepository,
    SyncZoneRegistryRepository,
    generateSyncId
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { resolveHomeZone } from '../../mapping/utils/resolve-home-zone.util';
import { SyncOutboxRepository } from '../../outbox/repository/sync-outbox.repository';
import { SYNC_MOVED_FROM_MARKER_PREFIX, SYNC_MOVED_TO_MARKER_PREFIX } from '../constant/sync-move-markers.constant';
import { HouseholdShareStateEnum } from '../enum/household-share-state.enum';
import { HouseholdUnavailableError } from '../error/household-unavailable.error';
import { HouseholdShareRepository } from '../repository/household-share.repository';

import type { HouseholdShareEverythingStateInterface } from '../interface/household-share-everything-state.interface';
import type { HouseholdShareStatusInterface } from '../interface/household-share-status.interface';
import type { DbError } from '@budgie/contracts';

const ALIGNMENT_BATCH_SIZE = 100;
const BUDGET_CHILD_TABLES = ['budget_category_limits', 'budget_sinking_funds', 'budget_limit_changes'] as const;

type LabeledTableType = 'categories' | 'tags';
type LabeledMemoType = Map<string, number>;

export class HouseholdShareService extends Context.Service<HouseholdShareService>()('@budgie/cloud-sync/HouseholdShareService', {
    make: Effect.gen(function* () {
        const repository = yield* HouseholdShareRepository;
        const outboxRepository = yield* SyncOutboxRepository;
        const applyStateRepository = yield* SyncApplyStateRepository;
        const zoneRegistryRepository = yield* SyncZoneRegistryRepository;

        const isAvailable = zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE).pipe(Effect.map(isDefined));

        const requireHousehold = Effect.fnUntraced(function* () {
            if (!(yield* isAvailable)) {
                return yield* HouseholdUnavailableError.make({});
            }
        });

        const enqueueSave = (recordType: SyncRecordTypeEnum, syncZone: string, syncId: string, changedColumns: readonly string[]) =>
            outboxRepository.enqueue({
                recordType,
                syncZone,
                syncId,
                operation: SyncOutboxOperationEnum.SAVE,
                changedColumns: JSON.stringify(changedColumns)
            });

        const enqueueMove = (recordType: SyncRecordTypeEnum, syncId: string, from: string, to: string) =>
            enqueueSave(recordType, to, syncId, [`${SYNC_MOVED_FROM_MARKER_PREFIX}${from}`]).pipe(
                Effect.andThen(
                    outboxRepository.enqueue({
                        recordType,
                        syncZone: from,
                        syncId,
                        operation: SyncOutboxOperationEnum.DELETE,
                        changedColumns: JSON.stringify(to === HOUSEHOLD_SYNC_ZONE ? [`${SYNC_MOVED_TO_MARKER_PREFIX}${to}`] : [])
                    })
                )
            );

        const ensureLabeled: (
            tableName: LabeledTableType,
            id: number,
            zone: string,
            memo: LabeledMemoType
        ) => Effect.Effect<number, DbError, Db> = Effect.fnUntraced(function* (tableName, id, zone, memo) {
            const memoKey = `${tableName}|${zone}|${id}`;
            const cached = memo.get(memoKey);

            if (isDefined(cached)) {
                return cached;
            }

            const source = yield* repository.findLabeledRow(tableName, id);

            if (!isDefined(source) || source.syncZone === zone) {
                memo.set(memoKey, id);

                return id;
            }

            const isSeed = tableName === 'categories' && source.isDefault === 1;
            const existingId = isSeed
                ? yield* repository.findIdByIdentity(tableName, zone, source.syncId)
                : yield* repository.findIdByTitle(tableName, zone, source.title);

            if (isDefined(existingId)) {
                memo.set(memoKey, existingId);

                return existingId;
            }

            const syncId = isSeed ? source.syncId : generateSyncId();
            const clonedId = yield* repository.cloneRow(tableName === 'categories' ? CategoryEntityTable : TagEntityTable, tableName, id, {
                sync_zone: zone,
                sync_id: syncId
            });

            memo.set(memoKey, clonedId);

            if (tableName === 'categories') {
                if (isSeed) {
                    yield* repository.copyCategoryTranslations(id, clonedId);
                }

                if (isDefined(source.parentId)) {
                    const parentId = yield* ensureLabeled('categories', source.parentId, zone, memo);

                    yield* repository.setCategoryParent(clonedId, parentId);
                }
            }

            yield* enqueueSave(tableName === 'categories' ? SyncRecordTypeEnum.CATEGORY : SyncRecordTypeEnum.TAG, zone, syncId, []);

            return clonedId;
        });

        const moveIntegrations = Effect.fnUntraced(function* (
            integrationIds: readonly (number | null)[],
            movedAccountIds: readonly number[],
            from: string,
            to: string
        ) {
            for (const integrationId of new Set(integrationIds.filter(isDefined))) {
                const integration = yield* repository.findIntegration(integrationId);
                const otherAccountCount =
                    to === HOUSEHOLD_SYNC_ZONE
                        ? 0
                        : yield* repository.countOtherAccountsOnIntegration(integrationId, movedAccountIds, from);
                const hasRemainingAccounts = otherAccountCount > 0;

                if (isDefined(integration) && integration.syncZone === from && !hasRemainingAccounts) {
                    yield* repository.setZone('bank_integrations', [integration.id], to);
                    yield* enqueueMove(SyncRecordTypeEnum.BANK_INTEGRATION, integration.syncId, from, to);
                }
            }
        });

        const moveDebtEvents = Effect.fnUntraced(function* (accountIds: readonly number[], from: string, to: string) {
            const events = yield* repository.findDebtEventsOnAccounts(accountIds, from);

            yield* repository.setZone(
                'debt_events',
                events.map(({ id }) => id),
                to
            );
            yield* Effect.forEach(events, event => enqueueMove(SyncRecordTypeEnum.DEBT_EVENT, event.syncId, from, to), { discard: true });
        });

        const moveRules = Effect.fnUntraced(function* (accountIds: readonly number[], from: string, to: string, memo: LabeledMemoType) {
            for (const rule of yield* repository.findRulesOnAccounts(accountIds, from)) {
                for (const action of yield* repository.findRuleActionReferences(rule.id)) {
                    const categoryId = isDefined(action.categoryId)
                        ? yield* ensureLabeled('categories', action.categoryId, to, memo)
                        : null;
                    const tagId = isDefined(action.tagId) ? yield* ensureLabeled('tags', action.tagId, to, memo) : null;

                    yield* repository.setRuleActionReferences(action.id, categoryId, tagId);
                }

                yield* repository.setZone('rules', [rule.id], to);
                yield* repository.setChildZone('rule_conditions', 'rule_id', [rule.id], to);
                yield* repository.setChildZone('rule_actions', 'rule_id', [rule.id], to);
                yield* enqueueMove(SyncRecordTypeEnum.RULE, rule.syncId, from, to);
            }
        });

        const alignBatch = Effect.fnUntraced(function* (transactionIds: readonly number[], memo: LabeledMemoType) {
            const entries = yield* repository.findAlignmentEntries(transactionIds);
            const tags = yield* repository.findAlignmentTags(transactionIds);

            for (const transactionId of transactionIds) {
                const transactionEntries = entries.filter(entry => entry.transactionId === transactionId);
                const [first] = transactionEntries;

                if (isDefined(first)) {
                    const transactionTags = tags.filter(tag => tag.transactionId === transactionId);
                    const oldHome = first.transactionZone;
                    const newHome = resolveHomeZone([...new Set(transactionEntries.map(entry => entry.accountZone))].sort(), oldHome);
                    const misplacedEntries = transactionEntries.filter(entry => entry.entryZone !== entry.accountZone);
                    const recategorized = transactionEntries.filter(
                        entry => isDefined(entry.categoryId) && isDefined(entry.categoryZone) && entry.categoryZone !== entry.accountZone
                    );
                    const retagged = transactionTags.filter(tag => tag.tagZone !== newHome);

                    for (const zone of new Set(misplacedEntries.map(entry => entry.accountZone))) {
                        yield* repository.setEntryZone(
                            misplacedEntries.filter(entry => entry.accountZone === zone).map(entry => entry.entryId),
                            zone
                        );
                    }

                    for (const entry of recategorized) {
                        if (isDefined(entry.categoryId)) {
                            const categoryId = yield* ensureLabeled('categories', entry.categoryId, entry.accountZone, memo);

                            yield* repository.setEntryCategory(entry.entryId, categoryId);
                        }
                    }

                    for (const tag of retagged) {
                        const tagId = yield* ensureLabeled('tags', tag.tagId, newHome, memo);

                        yield* repository.setTransactionTag(tag.rowId, tagId, newHome);
                    }

                    if (oldHome !== newHome || transactionTags.some(tag => tag.rowZone !== newHome)) {
                        yield* repository.setTransactionChildrenZone(transactionId, newHome);
                    }

                    if (oldHome !== newHome) {
                        yield* enqueueMove(SyncRecordTypeEnum.TRANSACTION, first.transactionSyncId, oldHome, newHome);
                    } else if (isNotEmptyArray(misplacedEntries) || isNotEmptyArray(recategorized) || isNotEmptyArray(retagged)) {
                        yield* enqueueSave(SyncRecordTypeEnum.TRANSACTION, newHome, first.transactionSyncId, [
                            'transaction_entries',
                            ...(isNotEmptyArray(retagged) ? ['transaction_tags'] : [])
                        ]);
                    }
                }
            }
        });

        const alignTransactionIds = Effect.fnUntraced(function* (transactionIds: readonly number[], memo: LabeledMemoType) {
            for (let offset = 0; offset < transactionIds.length; offset += ALIGNMENT_BATCH_SIZE) {
                yield* applyStateRepository.withoutTriggers(alignBatch(transactionIds.slice(offset, offset + ALIGNMENT_BATCH_SIZE), memo));
                yield* YIELD_TO_UI;
            }
        });

        const moveAccounts = Effect.fn('HouseholdShareService.moveAccounts')(function* (
            requestedIds: readonly number[],
            from: string,
            to: string,
            ownedIds: ReadonlySet<number> | null
        ) {
            const family = yield* repository.findFamilyAccountIds(requestedIds);
            const accounts = (yield* repository.findAccounts(family)).filter(
                account => account.syncZone === from && (!isDefined(ownedIds) || ownedIds.has(account.id))
            );
            const accountIds = accounts.map(({ id }) => id);
            const memo: LabeledMemoType = new Map();

            if (isEmptyArray(accounts)) {
                return;
            }

            yield* applyStateRepository.withoutTriggers(
                Effect.gen(function* () {
                    yield* repository.setZone('accounts', accountIds, to);
                    yield* repository.setChildZone('account_external_ids', 'account_id', accountIds, to);
                    yield* Effect.forEach(accounts, account => enqueueMove(SyncRecordTypeEnum.ACCOUNT, account.syncId, from, to), {
                        discard: true
                    });
                    yield* moveIntegrations(
                        accounts.map(account => account.integrationId),
                        accountIds,
                        from,
                        to
                    );
                    yield* moveDebtEvents(accountIds, from, to);
                    yield* moveRules(accountIds, from, to, memo);
                })
            );
            const transactionIds = yield* repository.findTransactionIdsOnAccounts(accountIds);

            yield* alignTransactionIds(transactionIds, memo);
        });

        const moveSeries = Effect.fnUntraced(function* (seriesId: number, from: string, to: string, memo: LabeledMemoType) {
            const series = yield* repository.findRecurringSeries(seriesId);

            if (isDefined(series) && series.syncZone === from) {
                if (isDefined(series.categoryId)) {
                    const categoryId = yield* ensureLabeled('categories', series.categoryId, to, memo);

                    yield* repository.setSeriesCategory(series.id, categoryId);
                }

                yield* repository.setZone('recurring_series', [series.id], to);
                yield* enqueueMove(SyncRecordTypeEnum.RECURRING_SERIES, series.syncId, from, to);
            }
        });

        const moveBudget = Effect.fn('HouseholdShareService.moveBudget')(function* (
            budgetId: number,
            from: string,
            to: string,
            ownedIds: ReadonlySet<number> | null
        ) {
            const budget = yield* repository.findBudget(budgetId);

            if (!isDefined(budget) || budget.syncZone !== from || (isDefined(ownedIds) && !ownedIds.has(budgetId))) {
                return;
            }

            const memo: LabeledMemoType = new Map();

            yield* applyStateRepository.withoutTriggers(
                Effect.gen(function* () {
                    if (isDefined(budget.tagId)) {
                        const tagId = yield* ensureLabeled('tags', budget.tagId, to, memo);

                        yield* repository.setBudgetTag(budget.id, tagId);
                    }

                    for (const reference of yield* repository.findBudgetCategoryReferences(budget.id)) {
                        if (isDefined(reference.categoryId)) {
                            const categoryId = yield* ensureLabeled('categories', reference.categoryId, to, memo);

                            yield* repository.setBudgetChildCategory(reference.tableName, reference.id, categoryId);
                        }

                        if (isDefined(reference.seriesId)) {
                            yield* moveSeries(reference.seriesId, from, to, memo);
                        }
                    }

                    yield* repository.setZone('budgets', [budget.id], to);

                    for (const childTable of BUDGET_CHILD_TABLES) {
                        yield* repository.setChildZone(childTable, 'budget_id', [budget.id], to);
                    }

                    yield* enqueueMove(SyncRecordTypeEnum.BUDGET, budget.syncId, from, to);
                })
            );
        });

        const findSharedAccountIds = repository.findAccountIdsSharedByThisUser(HOUSEHOLD_SYNC_ZONE);
        const findSharedBudgetIds = repository.findBudgetIdsSharedByThisUser(HOUSEHOLD_SYNC_ZONE);

        const alignZones = Effect.fn('HouseholdShareService.alignZones')(function* () {
            const transactionIds = yield* repository.findMisalignedTransactionIds;

            if (isNotEmptyArray(transactionIds)) {
                yield* alignTransactionIds(transactionIds, new Map());
            }
        });

        const applyShareEverything = Effect.fn('HouseholdShareService.applyShareEverything')(function* () {
            const isSharingEverything = yield* repository.findShareEverything;
            const isHouseholdAvailable = yield* isAvailable;

            if (isSharingEverything && isHouseholdAvailable) {
                const personalAccountIds = yield* repository.findPersonalAccountIds;

                yield* moveAccounts(personalAccountIds, PERSONAL_SYNC_ZONE, HOUSEHOLD_SYNC_ZONE, null);
            }
        });

        const resolveShareState = (syncZone: string | undefined, id: number, sharedIds: readonly number[]) => {
            if (syncZone !== HOUSEHOLD_SYNC_ZONE) {
                return HouseholdShareStateEnum.PRIVATE;
            }

            return sharedIds.includes(id) ? HouseholdShareStateEnum.SHARED_BY_ME : HouseholdShareStateEnum.SHARED_BY_OTHER;
        };

        return {
            isAvailable,
            findShareEverything: repository.findShareEverything,
            findShareEverythingState: Effect.fn('HouseholdShareService.findShareEverythingState')(function* () {
                const isHouseholdAvailable = yield* isAvailable;
                const isEnabled = yield* repository.findShareEverything;

                return { isAvailable: isHouseholdAvailable, isEnabled } satisfies HouseholdShareEverythingStateInterface;
            }),
            findAccountShareStatus: Effect.fn('HouseholdShareService.findAccountShareStatus')(function* (accountId: number) {
                const household = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);
                const accounts = yield* repository.findAccounts([accountId]);
                const sharedIds = yield* findSharedAccountIds;

                return {
                    isAvailable: isDefined(household),
                    ownerName: household?.ownerName ?? null,
                    state: resolveShareState(accounts.at(0)?.syncZone, accountId, sharedIds)
                } satisfies HouseholdShareStatusInterface;
            }),
            findBudgetShareStatus: Effect.fn('HouseholdShareService.findBudgetShareStatus')(function* (budgetId: number) {
                const household = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);
                const budget = yield* repository.findBudget(budgetId);
                const sharedIds = yield* findSharedBudgetIds;

                return {
                    isAvailable: isDefined(household),
                    ownerName: household?.ownerName ?? null,
                    state: resolveShareState(budget?.syncZone, budgetId, sharedIds)
                } satisfies HouseholdShareStatusInterface;
            }),
            findPrivateSideOwnerName: Effect.fn('HouseholdShareService.findPrivateSideOwnerName')(function* (
                syncZone: string,
                syncId: string
            ) {
                const privateSideOwnerName = yield* repository.findPrivateSideOwnerName(syncZone, syncId);

                if (isDefined(privateSideOwnerName)) {
                    return privateSideOwnerName;
                }

                return null;
            }),
            findSharedAccountIds,
            findSharedBudgetIds,
            shareAccount: Effect.fn('HouseholdShareService.shareAccount')(function* (accountId: number) {
                yield* requireHousehold();
                yield* moveAccounts([accountId], PERSONAL_SYNC_ZONE, HOUSEHOLD_SYNC_ZONE, null);
            }),
            unshareAccount: Effect.fn('HouseholdShareService.unshareAccount')(function* (accountId: number) {
                const sharedIds = yield* findSharedAccountIds;

                yield* moveAccounts([accountId], HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE, new Set(sharedIds));
            }),
            setShareEverything: Effect.fn('HouseholdShareService.setShareEverything')(function* (isEnabled: boolean) {
                if (isEnabled) {
                    yield* requireHousehold();
                }

                yield* repository.setShareEverything(isEnabled);
                yield* applyShareEverything();
            }),
            shareBudget: Effect.fn('HouseholdShareService.shareBudget')(function* (budgetId: number) {
                yield* requireHousehold();
                yield* moveBudget(budgetId, PERSONAL_SYNC_ZONE, HOUSEHOLD_SYNC_ZONE, null);
            }),
            unshareBudget: Effect.fn('HouseholdShareService.unshareBudget')(function* (budgetId: number) {
                const sharedIds = yield* findSharedBudgetIds;

                yield* moveBudget(budgetId, HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE, new Set(sharedIds));
            }),
            moveLabelsToPersonal: Effect.fn('HouseholdShareService.moveLabelsToPersonal')(function* () {
                const memo: LabeledMemoType = new Map();

                for (const tableName of ['categories', 'tags'] as const) {
                    for (const id of yield* repository.findLabeledIdsInZone(tableName, HOUSEHOLD_SYNC_ZONE)) {
                        const targetId = yield* ensureLabeled(tableName, id, PERSONAL_SYNC_ZONE, memo);

                        if (targetId !== id) {
                            yield* repository.repointLabelReferences(tableName, id, targetId);
                        }
                    }
                }
            }),
            alignZones,
            reconcile: Effect.fn('HouseholdShareService.reconcile')(function* () {
                yield* applyShareEverything();
                yield* alignZones();
            })
        };
    })
}) {
    static readonly layer = Layer.effect(HouseholdShareService, HouseholdShareService.make).pipe(
        Layer.provide([
            HouseholdShareRepository.layer,
            SyncOutboxRepository.layer,
            SyncApplyStateRepository.layer,
            SyncZoneRegistryRepository.layer
        ])
    );
}
