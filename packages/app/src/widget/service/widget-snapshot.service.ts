import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { Workload } from '../../@generic/service/workload.service';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';
import BudgetWidget from '../widget/budget.widget';
import NetWorthWidget from '../widget/net-worth.widget';
import QuickAddWidget from '../widget/quick-add.widget';

import { WidgetSnapshotBuilderService } from './widget-snapshot-builder.service';

import type { WidgetBudgetSnapshotInterface } from '../interface/widget-budget-snapshot.interface';
import type { WidgetLinksInterface } from '../interface/widget-links.interface';
import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';

export class WidgetSnapshotService extends Context.Service<WidgetSnapshotService>()('@budgie/app/WidgetSnapshotService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const widgetSnapshotBuilderService = yield* WidgetSnapshotBuilderService;
        const backgroundTaskMinimumIntervalMinutes = 60;
        const publishDebounceMs = 2_000;
        const publishKey = 'widget-snapshot-publish';
        const budgetUrl = 'budgie://budget';
        const links: WidgetLinksInterface = {
            expenseUrl: 'budgie://create-transaction/expense',
            incomeUrl: 'budgie://create-transaction/income',
            transferUrl: 'budgie://create-transaction/transfer',
            homeUrl: 'budgie://'
        };
        const emptyNetWorth: WidgetNetWorthSnapshotInterface = {
            formattedTotal: '',
            formattedDelta: '',
            deltaColor: 'secondary',
            accountTypes: [],
            runway: { isPositive: true, label: '' }
        };
        const emptyBudget: WidgetBudgetSnapshotInterface = {
            formattedSpent: '',
            formattedLimit: '',
            formattedRemaining: '',
            progressRatio: 0,
            formattedProgress: '',
            isOverLimit: false,
            formattedDaysLeft: '',
            formattedSafePerDay: '',
            categories: []
        };
        const writeSemaphore = yield* Semaphore.make(1);
        const isLocked = yield* Ref.make(false);
        const publishedSnapshotKey = yield* Ref.make('');
        const runFork = yield* FiberSet.runtime(yield* FiberSet.make())();

        const pushToWidgets = (snapshot: WidgetSnapshotInterface): void => {
            NetWorthWidget.updateSnapshot({
                isEmpty: !isDefined(snapshot.netWorth),
                netWorth: snapshot.netWorth ?? emptyNetWorth,
                strings: snapshot.strings,
                homeUrl: links.homeUrl
            });

            if (isDefined(snapshot.budget)) {
                BudgetWidget.updateTimeline(
                    snapshot.budget.map(entry => ({
                        date: entry.date,
                        props: { isEmpty: false, budget: entry.budget, strings: snapshot.strings, budgetUrl }
                    }))
                );
            } else {
                BudgetWidget.updateSnapshot({ isEmpty: true, budget: emptyBudget, strings: snapshot.strings, budgetUrl });
            }

            QuickAddWidget.updateSnapshot({ strings: snapshot.strings, links });
        };

        const write = Effect.fn('WidgetSnapshotService.write')(function* (isMaskForced: boolean) {
            const snapshot = yield* widgetSnapshotBuilderService.buildSnapshot(isMaskForced);
            const snapshotKey = JSON.stringify(snapshot);

            if (snapshotKey === (yield* Ref.get(publishedSnapshotKey))) {
                return false;
            }

            pushToWidgets(snapshot);
            yield* Ref.set(publishedSnapshotKey, snapshotKey);

            return true;
        });

        const writeIfUnlocked = Effect.fn('WidgetSnapshotService.writeIfUnlocked')(function* () {
            return !(yield* Ref.get(isLocked)) && (yield* write(false));
        });

        const publish = Effect.fn('WidgetSnapshotService.publish')(function* () {
            return yield* writeSemaphore.withPermits(1)(writeIfUnlocked());
        });

        const debouncePublish = Effect.fn('WidgetSnapshotService.debouncePublish')(function* () {
            yield* workload.schedule(publishKey, Effect.andThen(Effect.sleep(publishDebounceMs), publish()).pipe(Effect.ignore), {
                replace: true
            });
        });

        const schedulePublish = (): void => {
            runFork(debouncePublish());
        };

        return {
            registerBackgroundTask: Effect.fn('WidgetSnapshotService.registerBackgroundTask')(function* () {
                if (Platform.OS !== 'ios' || (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(WIDGET_SNAPSHOT_TASK)))) {
                    return;
                }

                yield* Effect.tryPromise(() =>
                    BackgroundTask.registerTaskAsync(WIDGET_SNAPSHOT_TASK, { minimumInterval: backgroundTaskMinimumIntervalMinutes })
                );
            }),
            publish,
            mask: Effect.fn('WidgetSnapshotService.mask')(function* () {
                yield* Ref.set(isLocked, true);
                yield* workload.cancelScheduled(publishKey);

                return yield* writeSemaphore.withPermits(1)(write(true));
            }),
            start: Effect.fn('WidgetSnapshotService.start')(function* () {
                if (Platform.OS !== 'ios') {
                    return;
                }

                runFork(
                    Effect.callback<never>(() => {
                        const unsubscribe = databaseRefreshService.subscribe(schedulePublish);

                        return Effect.sync(unsubscribe);
                    })
                );
                yield* debouncePublish();
            }),
            unlock: (): void => {
                runFork(Effect.andThen(Ref.set(isLocked, false), debouncePublish()));
            }
        };
    })
}) {
    static readonly layer = Layer.effect(WidgetSnapshotService, WidgetSnapshotService.make).pipe(
        Layer.provide([Workload.layer, WidgetSnapshotBuilderService.layer])
    );
}
