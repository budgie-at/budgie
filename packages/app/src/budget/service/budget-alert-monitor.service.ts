import { BudgetAlertScopeEnum, budgetAlertThresholdService, budgetPeriodService, budgetSpentService } from '@budgie/budget';
import { Db, LanguageEnum } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as BackgroundTask from 'expo-background-task';
import Storage from 'expo-sqlite/kv-store';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetCategoryLimitRepository, budgetRepository, categoryRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { postLocalNotification } from '../../@generic/utils/request-push-permission.util';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';

import type { BudgetAlertTriggerInterface, BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

class BudgetAlertMonitorService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;
    private static readonly STORAGE_KEY_PREFIX = '@budgie:budget-alerts-fired';
    private static readonly FiredTriggersSchema = Schema.fromJsonString(Schema.Array(Schema.String));

    readonly run = Effect.fn('BudgetAlertMonitorService.run')(function* (this: BudgetAlertMonitorService) {
        const [budget, settings] = yield* Effect.all(
            [Db.query(db => budgetRepository.findActive(db)), Db.query(() => settingsRepository.findSettings())],
            {
                concurrency: 'unbounded'
            }
        );
        const isBudgetPushEnabled = isDefined(settings) ? settings.isBudgetPushEnabled : false;

        if (!isDefined(budget) || !isBudgetPushEnabled) {
            return [];
        }

        const periodStartMs = budgetPeriodService
            .computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date())
            .periodStart.getTime();
        const spent = yield* this.computeSpent(budget);
        const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);
        const triggers = budgetAlertThresholdService.computeTriggers(budget, spent, categoryLimits);
        const storageKey = this.buildStorageKey(budget.id, periodStartMs);
        const newTriggers = yield* this.filterDeliveredTriggers(storageKey, triggers);

        yield* Effect.forEach(
            newTriggers,
            trigger =>
                this.postTrigger(trigger, budget.overallLimit, spent).pipe(
                    Effect.as(true),
                    Effect.orElseSucceed(() => false),
                    Effect.flatMap(posted => (posted ? this.markDelivered(storageKey, trigger) : Effect.void))
                ),
            { concurrency: 'unbounded', discard: true }
        );

        return newTriggers;
    });

    readonly registerBackgroundTask = Effect.fn('BudgetAlertMonitorService.registerBackgroundTask')(function* () {
        const options = yield* Effect.promise(() =>
            TaskManager.getTaskOptionsAsync<BackgroundTask.BackgroundTaskOptions | null>(BudgetBackgroundTaskNameEnum.ALERT_MONITOR)
        );

        if (options?.minimumInterval === BudgetAlertMonitorService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES) {
            return;
        }

        if (isDefined(options)) {
            yield* Effect.tryPromise(() => BackgroundTask.unregisterTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR));
        }

        yield* Effect.tryPromise(() =>
            BackgroundTask.registerTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, {
                minimumInterval: BudgetAlertMonitorService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
            })
        );
    });

    private readonly computeSpent = Effect.fn('BudgetAlertMonitorService.computeSpent')(function* (
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
        const entries = yield* Db.query(() => budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId));

        return budgetSpentService.computeSpent(entries, budget.instrumentId);
    });

    private readonly filterDeliveredTriggers = Effect.fn('BudgetAlertMonitorService.filterDeliveredTriggers')(function* (
        this: BudgetAlertMonitorService,
        storageKey: string,
        triggers: readonly BudgetAlertTriggerInterface[]
    ) {
        const fired = yield* this.loadDeliveredTriggerKeys(storageKey);

        return triggers.filter(trigger => !fired.has(this.buildTriggerKey(trigger)));
    });

    private readonly markDelivered = Effect.fn('BudgetAlertMonitorService.markDelivered')(function* (
        this: BudgetAlertMonitorService,
        storageKey: string,
        trigger: BudgetAlertTriggerInterface
    ) {
        const fired = yield* this.loadDeliveredTriggerKeys(storageKey);
        fired.add(this.buildTriggerKey(trigger));
        yield* Effect.tryPromise(() => Storage.setItem(storageKey, JSON.stringify([...fired])));
    });

    private readonly loadDeliveredTriggerKeys = Effect.fn('BudgetAlertMonitorService.loadDeliveredTriggerKeys')(function* (
        storageKey: string
    ) {
        const raw = yield* Effect.tryPromise(() => Storage.getItem(storageKey));

        if (!isDefined(raw)) {
            return new Set<string>();
        }

        return new Set(Option.getOrElse(Schema.decodeUnknownOption(BudgetAlertMonitorService.FiredTriggersSchema)(raw), () => []));
    });

    private readonly postTrigger = Effect.fn('BudgetAlertMonitorService.postTrigger')(function* (
        this: BudgetAlertMonitorService,
        trigger: BudgetAlertTriggerInterface,
        overallLimit: number,
        spent: BudgetSpentInterface
    ) {
        if (trigger.scope === BudgetAlertScopeEnum.OVERALL) {
            return yield* this.postOverallAlert(trigger.threshold, overallLimit, spent.spentOverall);
        }

        if (trigger.scope === BudgetAlertScopeEnum.OTHER) {
            return yield* this.postOtherAlert(trigger.threshold);
        }

        if (isDefined(trigger.categoryId)) {
            return yield* this.postCategoryAlert(trigger.threshold, trigger.categoryId);
        }

        return yield* Effect.void;
    });

    private readonly postOverallAlert = Effect.fn('BudgetAlertMonitorService.postOverallAlert')(function* (
        threshold: number,
        overallLimit: number,
        spentOverall: number
    ) {
        const spentPercent = isPositiveNumber(overallLimit) ? Math.round((spentOverall / overallLimit) * 100) : threshold;
        const title = threshold >= 100 ? i18n._(msg`Budget limit reached`) : i18n._(msg`Overall budget: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${spentPercent}% of your overall budget.`);

        yield* Effect.tryPromise(() => postLocalNotification(title, body));
    });

    private readonly postOtherAlert = Effect.fn('BudgetAlertMonitorService.postOtherAlert')(function* (threshold: number) {
        const title = threshold >= 100 ? i18n._(msg`Other budget: limit reached`) : i18n._(msg`Other budget: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${threshold}% of your budget for spending outside category limits.`);

        yield* Effect.tryPromise(() => postLocalNotification(title, body));
    });

    private readonly postCategoryAlert = Effect.fn('BudgetAlertMonitorService.postCategoryAlert')(function* (
        threshold: number,
        categoryId: number
    ) {
        const settings = yield* Db.query(() => settingsRepository.findSettings());
        const language = isDefined(settings) ? settings.language : LanguageEnum.EN;
        const [category] = yield* Db.query(() => categoryRepository.findById(categoryId, language));
        const categoryName = isDefined(category) ? category.title : i18n._(msg`Category`);
        const title = threshold >= 100 ? i18n._(msg`${categoryName}: limit reached`) : i18n._(msg`${categoryName}: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${threshold}% of the limit for ${categoryName}.`);

        yield* Effect.tryPromise(() => postLocalNotification(title, body));
    });

    private buildStorageKey(budgetId: number, periodStartMs: number): string {
        return `${BudgetAlertMonitorService.STORAGE_KEY_PREFIX}:${budgetId}:${periodStartMs}`;
    }

    private buildTriggerKey(trigger: BudgetAlertTriggerInterface): string {
        const categoryKey = isDefined(trigger.categoryId) ? trigger.categoryId : '';

        return `${trigger.scope}:${categoryKey}:${trigger.threshold}`;
    }
}

export const budgetAlertMonitorService = new BudgetAlertMonitorService();
