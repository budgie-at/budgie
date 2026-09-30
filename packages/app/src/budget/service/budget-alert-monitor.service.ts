import {
    BudgetAlertScopeEnum,
    BudgetAlertThresholdService,
    BudgetCategoryLimitRepository,
    budgetPeriodService,
    BudgetRepository,
    BudgetSpentService
} from '@budgie/budget';
import { CategoryRepository, LanguageEnum, SettingsRepository } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as BackgroundTask from 'expo-background-task';
import Storage from 'expo-sqlite/kv-store';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { postLocalNotification } from '../../@generic/utils/request-push-permission.util';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';

import type { BudgetAlertTriggerInterface, BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

export class BudgetAlertMonitorService extends Context.Service<BudgetAlertMonitorService>()('@budgie/app/BudgetAlertMonitorService', {
    make: Effect.gen(function* () {
        const budgetAlertThresholdService = yield* BudgetAlertThresholdService;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetRepository = yield* BudgetRepository;
        const budgetSpentService = yield* BudgetSpentService;
        const categoryRepository = yield* CategoryRepository;
        const settingsRepository = yield* SettingsRepository;

        const backgroundTaskMinimumIntervalMinutes = 15;
        const storageKeyPrefix = '@budgie:budget-alerts-fired';
        const firedTriggersSchema = Schema.fromJsonString(Schema.Array(Schema.String));

        const buildStorageKey = (budgetId: number, periodStartMs: number): string => `${storageKeyPrefix}:${budgetId}:${periodStartMs}`;

        const buildTriggerKey = (trigger: BudgetAlertTriggerInterface): string => {
            const categoryKey = isDefined(trigger.categoryId) ? trigger.categoryId : '';

            return `${trigger.scope}:${categoryKey}:${trigger.threshold}`;
        };

        const computeSpent = Effect.fn('BudgetAlertMonitorService.computeSpent')(function* (
            budget: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth' | 'instrumentId'>
        ) {
            if (!isPositiveNumber(budget.instrumentId)) {
                const empty: BudgetSpentInterface = { spentOverall: 0, spentByCategory: [] };

                return empty;
            }

            const { periodStart, nextPeriodStart } = budgetPeriodService.computePeriodWindow(
                budget.periodStartDay,
                budget.useLastDayOfMonth,
                new Date()
            );
            const entries = yield* budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId);

            return budgetSpentService.computeSpent(entries, budget.instrumentId);
        });

        const loadDeliveredTriggerKeys = Effect.fn('BudgetAlertMonitorService.loadDeliveredTriggerKeys')(function* (storageKey: string) {
            const raw = yield* Effect.promise(() => Storage.getItem(storageKey));

            if (!isDefined(raw)) {
                return new Set<string>();
            }

            return new Set(Option.getOrElse(Schema.decodeUnknownOption(firedTriggersSchema)(raw), () => []));
        });

        const filterDeliveredTriggers = Effect.fn('BudgetAlertMonitorService.filterDeliveredTriggers')(function* (
            storageKey: string,
            triggers: readonly BudgetAlertTriggerInterface[]
        ) {
            const fired = yield* loadDeliveredTriggerKeys(storageKey);

            return triggers.filter(trigger => !fired.has(buildTriggerKey(trigger)));
        });

        const markDelivered = Effect.fn('BudgetAlertMonitorService.markDelivered')(function* (
            storageKey: string,
            trigger: BudgetAlertTriggerInterface
        ) {
            const fired = yield* loadDeliveredTriggerKeys(storageKey);
            fired.add(buildTriggerKey(trigger));
            yield* Effect.promise(() => Storage.setItem(storageKey, JSON.stringify([...fired])));
        });

        const postOverallAlert = Effect.fn('BudgetAlertMonitorService.postOverallAlert')(function* (
            threshold: number,
            overallLimit: number,
            spentOverall: number
        ) {
            const spentPercent = isPositiveNumber(overallLimit) ? Math.round((spentOverall / overallLimit) * 100) : threshold;
            const title = threshold >= 100 ? i18n._(msg`Budget limit reached`) : i18n._(msg`Overall budget: ${threshold}% spent`);
            const body = i18n._(msg`You have used ${spentPercent}% of your overall budget.`);

            yield* Effect.tryPromise(() => postLocalNotification(title, body));
        });

        const postOtherAlert = Effect.fn('BudgetAlertMonitorService.postOtherAlert')(function* (threshold: number) {
            const title = threshold >= 100 ? i18n._(msg`Other budget: limit reached`) : i18n._(msg`Other budget: ${threshold}% spent`);
            const body = i18n._(msg`You have used ${threshold}% of your budget for spending outside category limits.`);

            yield* Effect.tryPromise(() => postLocalNotification(title, body));
        });

        const postCategoryAlert = Effect.fn('BudgetAlertMonitorService.postCategoryAlert')(function* (
            threshold: number,
            categoryId: number
        ) {
            const settings = yield* settingsRepository.findSettings();
            const language = isDefined(settings) ? settings.language : LanguageEnum.EN;
            const [category] = yield* categoryRepository.findById(categoryId, language);
            const categoryName = isDefined(category) ? category.title : i18n._(msg`Category`);
            const title =
                threshold >= 100 ? i18n._(msg`${categoryName}: limit reached`) : i18n._(msg`${categoryName}: ${threshold}% spent`);
            const body = i18n._(msg`You have used ${threshold}% of the limit for ${categoryName}.`);

            yield* Effect.tryPromise(() => postLocalNotification(title, body));
        });

        const postTrigger = Effect.fn('BudgetAlertMonitorService.postTrigger')(function* (
            trigger: BudgetAlertTriggerInterface,
            overallLimit: number,
            spent: BudgetSpentInterface
        ) {
            if (trigger.scope === BudgetAlertScopeEnum.OVERALL) {
                return yield* postOverallAlert(trigger.threshold, overallLimit, spent.spentOverall);
            }

            if (trigger.scope === BudgetAlertScopeEnum.OTHER) {
                return yield* postOtherAlert(trigger.threshold);
            }

            if (isDefined(trigger.categoryId)) {
                return yield* postCategoryAlert(trigger.threshold, trigger.categoryId);
            }

            return yield* Effect.void;
        });

        return {
            run: Effect.fn('BudgetAlertMonitorService.run')(function* () {
                const [budget, settings] = yield* Effect.all([budgetRepository.findActive(), settingsRepository.findSettings()], {
                    concurrency: 'unbounded'
                });
                const isBudgetPushEnabled = isDefined(settings) ? settings.isBudgetPushEnabled : false;

                if (!isDefined(budget) || !isBudgetPushEnabled) {
                    return [];
                }

                const periodStartMs = budgetPeriodService
                    .computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date())
                    .periodStart.getTime();
                const spent = yield* computeSpent(budget);
                const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);
                const triggers = budgetAlertThresholdService.computeTriggers(budget, spent, categoryLimits);
                const storageKey = buildStorageKey(budget.id, periodStartMs);
                const newTriggers = yield* filterDeliveredTriggers(storageKey, triggers);

                yield* Effect.forEach(
                    newTriggers,
                    trigger =>
                        postTrigger(trigger, budget.overallLimit, spent).pipe(
                            Effect.as(true),
                            Effect.orElseSucceed(() => false),
                            Effect.flatMap(posted => (posted ? markDelivered(storageKey, trigger) : Effect.void))
                        ),
                    { concurrency: 'unbounded', discard: true }
                );

                return newTriggers;
            }),
            registerBackgroundTask: Effect.fn('BudgetAlertMonitorService.registerBackgroundTask')(function* () {
                const options = yield* Effect.promise(() =>
                    TaskManager.getTaskOptionsAsync<BackgroundTask.BackgroundTaskOptions | null>(BudgetBackgroundTaskNameEnum.ALERT_MONITOR)
                );

                if (options?.minimumInterval === backgroundTaskMinimumIntervalMinutes) {
                    return;
                }

                if (isDefined(options)) {
                    yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR));
                }

                yield* Effect.promise(() =>
                    BackgroundTask.registerTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, {
                        minimumInterval: backgroundTaskMinimumIntervalMinutes
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetAlertMonitorService, BudgetAlertMonitorService.make).pipe(
        Layer.provide([
            BudgetAlertThresholdService.layer,
            BudgetCategoryLimitRepository.layer,
            BudgetRepository.layer,
            BudgetSpentService.layer,
            CategoryRepository.layer,
            SettingsRepository.layer
        ])
    );
}
