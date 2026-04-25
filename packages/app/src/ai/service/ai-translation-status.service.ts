import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { translationProgressStore } from '../store/translation-progress.store';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { BaseSubsystemStatusService, EMPTY_SUBSYSTEM_SNAPSHOT } from './base-subsystem-status.service';
import { translationDrainerService } from './translation-drainer.service';

class AiTranslationStatusService extends BaseSubsystemStatusService {
    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    async rebuild(): Promise<void> {
        try {
            await this.pauseDrainer();
            try {
                await this.resetTranslations();
            } finally {
                translationDrainerService.resume();
            }
            void translationProgressStore.refresh();
            await translationDrainerService.boost();
        } catch (error: unknown) {
            translationDrainerService.resume();
            throw error;
        }
    }

    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    private async pauseDrainer(): Promise<void> {
        await translationDrainerService.pause();
    }

    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    private async resetTranslations(): Promise<void> {
        await categoryRepository.resetAllTranslations();
        await tagRepository.resetAllTranslations();
    }

    protected buildSubsystemSubscriptions(): (() => void)[] {
        return [translationDrainerService.subscribe(this.scheduleRecompute), translationProgressStore.subscribe(this.scheduleRecompute)];
    }

    protected derive(): AiSubsystemStatusSnapshotInterface {
        if (!this.isUmbrellaHealthy()) {
            return EMPTY_SUBSYSTEM_SNAPSHOT;
        }

        return buildSubsystemSnapshot(translationDrainerService.getSnapshot(), translationProgressStore.getSnapshot(), {
            boosting: t`Rebuilding translations`,
            working: t`Translating categories and tags`,
            ready: t`Translations ready`
        });
    }
}

export const aiTranslationStatusService = new AiTranslationStatusService();
