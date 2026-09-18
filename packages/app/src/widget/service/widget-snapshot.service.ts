import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { canPublishWidgetSnapshot, clearWidgetSnapshot, publishWidgetSnapshot } from '../../../modules/widget-bridge';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';

import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';

class WidgetSnapshotService {
    private static readonly APP_VARIANT_EXTRA_KEY = 'appVariant';
    private static readonly E2E_APP_VARIANT = 'e2e';
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly PUBLISH_DEBOUNCE_MS = 2_000;
    private static readonly SNAPSHOT_VERSION = 1;

    private isPublishing = false;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private unsubscribeDatabaseRefresh: () => void = emptyFn;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    start(): void {
        if (this.isDisabled()) {
            return;
        }

        this.unsubscribeDatabaseRefresh = databaseRefreshService.subscribe(this.schedulePublish);
        this.schedulePublish();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    stop(): void {
        this.unsubscribeDatabaseRefresh();
        this.unsubscribeDatabaseRefresh = emptyFn;
        this.cancelScheduledPublish();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (this.isDisabled()) {
            return;
        }

        if (await TaskManager.isTaskRegisteredAsync(WIDGET_SNAPSHOT_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(WIDGET_SNAPSHOT_TASK, {
            minimumInterval: WidgetSnapshotService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log('enter', result => `done isPublished=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async publish(): Promise<boolean> {
        if (this.isDisabled() || this.isPublishing) {
            return false;
        }

        this.isPublishing = true;

        try {
            return await publishWidgetSnapshot(JSON.stringify(this.buildSnapshot()));
        } finally {
            this.isPublishing = false;
        }
    }

    @Log('enter', result => `done isCleared=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async clear(): Promise<boolean> {
        this.cancelScheduledPublish();

        return await clearWidgetSnapshot();
    }

    private readonly schedulePublish = (): void => {
        this.cancelScheduledPublish();

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            void this.publish().catch(emptyFn);
        }, WidgetSnapshotService.PUBLISH_DEBOUNCE_MS);
    };

    private cancelScheduledPublish(): void {
        if (isDefined(this.debounceTimer)) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    private buildSnapshot(): WidgetSnapshotInterface {
        return {
            version: WidgetSnapshotService.SNAPSHOT_VERSION,
            generatedAtMs: Date.now()
        };
    }

    private isDisabled(): boolean {
        return this.isE2EApp() || !canPublishWidgetSnapshot();
    }

    private isE2EApp(): boolean {
        return Constants.expoConfig?.extra?.[WidgetSnapshotService.APP_VARIANT_EXTRA_KEY] === WidgetSnapshotService.E2E_APP_VARIANT;
    }
}

export const widgetSnapshotService = new WidgetSnapshotService();
