import { aiCoordinatorService } from '@app/ai/service/ai-coordinator.service';
import { aiModelResidencyService } from '@app/ai/service/ai-model-residency.service';
import { chatService } from '@app/ai/service/chat.service';
import { embeddingDrainerService } from '@app/ai/service/embedding-drainer.service';
import { translationDrainerService } from '@app/ai/service/translation-drainer.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

vi.mock('react-native', () => ({
    AppState: { currentState: 'active', addEventListener: () => ({ remove: emptyFn }) },
    InteractionManager: {
        runAfterInteractions: (callback: () => void) => {
            callback();

            return { cancel: emptyFn };
        }
    }
}));

vi.mock('@app/@generic/utils/is-ai-enabled.util', () => ({ isAiEnabled: () => true }));

vi.mock('@app/ai/service/translation-drainer.service', () => ({
    translationDrainerService: { start: vi.fn(), stop: vi.fn(), whenIdle: vi.fn() }
}));

vi.mock('@app/ai/service/embedding-drainer.service', () => ({
    embeddingDrainerService: { start: vi.fn(), stop: vi.fn(), whenIdle: vi.fn() }
}));

vi.mock('@app/ai/service/ai-model-residency.service', () => ({
    aiModelResidencyService: { resume: vi.fn(), suspend: vi.fn() }
}));

vi.mock('@app/ai/util/load-llama-context.util', () => ({ loadLlamaContext: vi.fn() }));

vi.mock('@app/ai/service/chat.service', () => ({ chatService: { interrupt: vi.fn() } }));

vi.mock('@app/ai/service/ai-umbrella-status.service', () => ({ aiUmbrellaStatusService: { start: vi.fn(), stop: vi.fn() } }));

vi.mock('@app/ai/service/ai-translation-status.service', () => ({ aiTranslationStatusService: { start: vi.fn(), stop: vi.fn() } }));

vi.mock('@app/ai/service/ai-embedding-status.service', () => ({ aiEmbeddingStatusService: { start: vi.fn(), stop: vi.fn() } }));

vi.mock('@app/ai/store/translation-progress.store', () => ({ translationProgressStore: { refresh: vi.fn() } }));

vi.mock('@app/ai/store/embedding-progress.store', () => ({ embeddingProgressStore: { refresh: vi.fn() } }));

const lifecycle: string[] = [];

const flushMicrotasks = () => new Promise<void>(resolve => void setTimeout(resolve, 0));

describe('ai/suspend-waits-for-in-flight-batch', () => {
    beforeEach(() => {
        lifecycle.length = 0;
        vi.mocked(chatService.interrupt)
            .mockReset()
            .mockImplementation(() => void lifecycle.push('interrupt'));
        vi.mocked(aiModelResidencyService.suspend)
            .mockReset()
            .mockImplementation(() => {
                lifecycle.push('suspend');

                return Promise.resolve();
            });
        vi.mocked(embeddingDrainerService.whenIdle).mockReset().mockResolvedValue(true);
        vi.mocked(translationDrainerService.whenIdle).mockReset();
    });

    it('releases model contexts only after the in-flight batch settles', async () => {
        let settleBatch = emptyFn;
        const pendingBatch = new Promise<boolean>(resolve => {
            settleBatch = () => {
                lifecycle.push('batch-settled');
                resolve(true);
            };
        });
        vi.mocked(translationDrainerService.whenIdle).mockReturnValue(pendingBatch);

        aiCoordinatorService.start();
        aiCoordinatorService.stop();
        await flushMicrotasks();

        expect(aiModelResidencyService.suspend).not.toHaveBeenCalled();

        settleBatch();
        await vi.waitFor(() => {
            expect(aiModelResidencyService.suspend).toHaveBeenCalledTimes(1);
        });

        expect(lifecycle).toStrictEqual(['batch-settled', 'suspend']);
        expect(chatService.interrupt).not.toHaveBeenCalled();
    });

    it('interrupts the generation before releasing when the batch exceeds the bound', async () => {
        vi.mocked(translationDrainerService.whenIdle).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

        aiCoordinatorService.start();
        aiCoordinatorService.stop();
        await vi.waitFor(() => {
            expect(aiModelResidencyService.suspend).toHaveBeenCalledTimes(1);
        });

        expect(lifecycle).toStrictEqual(['interrupt', 'suspend']);
        expect(vi.mocked(translationDrainerService.whenIdle).mock.calls).toStrictEqual([[5000], [2000]]);
    });
});
