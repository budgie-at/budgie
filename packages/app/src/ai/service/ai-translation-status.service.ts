import { t } from '@lingui/core/macro';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { translationProgressStore } from '../store/translation-progress.store';
import { aiLog } from '../utils/ai-log.util';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { BaseSubsystemStatusService, EMPTY_SUBSYSTEM_SNAPSHOT } from './base-subsystem-status.service';
import { translationDrainerService } from './translation-drainer.service';

class AiTranslationStatusService extends BaseSubsystemStatusService {
    // eslint-disable-next-line max-statements -- 5 rebuild phases with pause/resume bookends
    async rebuild(): Promise<void> {
        aiLog('system:action:translation:rebuild:start');
        const started = Date.now();
        try {
            await translationDrainerService.pause();
            aiLog('system:action:translation:rebuild:phase', { phase: 'paused' });
            try {
                await categoryRepository.resetAllTranslations();
                await tagRepository.resetAllTranslations();
                aiLog('system:action:translation:rebuild:phase', { phase: 'translations-reset' });
            } finally {
                translationDrainerService.resume();
            }
            void translationProgressStore.refresh();
            await translationDrainerService.boost();
            aiLog('system:action:translation:rebuild:complete', { durationMs: Date.now() - started });
        } catch (error: unknown) {
            aiLog('system:action:translation:rebuild:throw', { errorMessage: getErrorMessage(error) });
            translationDrainerService.resume();
            throw error;
        }
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
