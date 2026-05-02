import { getLogger } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { AiSystemUmbrellaSnapshotInterface } from '../interface/ai-system-umbrella-snapshot.interface';

import { ScheduledSnapshotStore } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';

const logger = getLogger('AiUmbrellaStatusService');

const TRUNCATE_LEN = 80;
const SUBSYSTEM_COUNT = 3;

const EMPTY_UMBRELLA_SNAPSHOT: AiSystemUmbrellaSnapshotInterface = {
    state: AiSystemUmbrellaStateEnum.DISABLED,
    statusText: '',
    downloadPercent: 0,
    errorMessage: null
};

class AiUmbrellaStatusService extends ScheduledSnapshotStore<AiSystemUmbrellaSnapshotInterface> {
    private lastState: AiSystemUmbrellaStateEnum = AiSystemUmbrellaStateEnum.DISABLED;
    private lastStateAt = Date.now();

    constructor() {
        super(EMPTY_UMBRELLA_SNAPSHOT);
    }

    protected buildSubscriptions(): (() => void)[] {
        return [
            chatService.subscribe(this.scheduleRecompute),
            embeddingService.subscribe(this.scheduleRecompute),
            sttService.subscribe(this.scheduleRecompute)
        ];
    }

    protected emptySnapshot(): AiSystemUmbrellaSnapshotInterface {
        return { ...EMPTY_UMBRELLA_SNAPSHOT };
    }

    protected recompute(): void {
        const next = this.derive();
        if (this.snapshotEquals(next)) {
            return;
        }
        if (next.state !== this.lastState) {
            const now = Date.now();
            logger.log('umbrella:state:transition', { from: this.lastState, to: next.state, durationMs: now - this.lastStateAt });
            this.lastState = next.state;
            this.lastStateAt = now;
        }
        this.setSnapshot(next);
    }

    // eslint-disable-next-line max-statements -- Priority-ordered derivation table across all subsystem statuses
    private derive(): AiSystemUmbrellaSnapshotInterface {
        if (!isAiEnabled()) {
            return { state: AiSystemUmbrellaStateEnum.DISABLED, statusText: t`AI off`, downloadPercent: 0, errorMessage: null };
        }

        const chat = chatService.getSnapshot();
        const embedding = embeddingService.getSnapshot();
        const stt = sttService.getSnapshot();

        const chatError = chat.errorMessage;
        const embeddingError = embedding.errorMessage;
        const sttError = stt.errorMessage;
        if (isDefined(chatError) || isDefined(embeddingError) || isDefined(sttError)) {
            const source = this.getErrorSource(chatError, embeddingError);

            const message = (chatError ?? embeddingError ?? sttError ?? '').slice(0, TRUNCATE_LEN);

            return {
                state: AiSystemUmbrellaStateEnum.MODEL_ERROR,
                statusText: t`${source} error · ${message}`,
                downloadPercent: 0,
                errorMessage: message
            };
        }

        const statuses = [chat.status, embedding.status, stt.status] as const;

        if (statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING)) {
            const downloadPercent = Math.round(
                (chat.downloadProgress + embedding.downloadProgress + stt.downloadProgress) / SUBSYSTEM_COUNT
            );

            return {
                state: AiSystemUmbrellaStateEnum.DOWNLOADING,
                statusText: t`Downloading AI models…`,
                downloadPercent,
                errorMessage: null
            };
        }

        if (statuses.some(status => status === AiSubsystemStatusEnum.INITIALIZING)) {
            return {
                state: AiSystemUmbrellaStateEnum.INITIALIZING,
                statusText: t`Starting up AI…`,
                downloadPercent: 0,
                errorMessage: null
            };
        }

        if (statuses.some(status => status === AiSubsystemStatusEnum.SUSPENDED)) {
            return {
                state: AiSystemUmbrellaStateEnum.SUSPENDED,
                statusText: t`Resuming AI…`,
                downloadPercent: 0,
                errorMessage: null
            };
        }

        if (statuses.some(status => status === AiSubsystemStatusEnum.IDLE)) {
            return {
                state: AiSystemUmbrellaStateEnum.IDLE,
                statusText: t`AI idle`,
                downloadPercent: 0,
                errorMessage: null
            };
        }

        if (statuses.every(status => status === AiSubsystemStatusEnum.DISABLED)) {
            return { state: AiSystemUmbrellaStateEnum.DISABLED, statusText: t`AI off`, downloadPercent: 0, errorMessage: null };
        }

        return { state: AiSystemUmbrellaStateEnum.HEALTHY, statusText: '', downloadPercent: 0, errorMessage: null };
    }

    private snapshotEquals(next: AiSystemUmbrellaSnapshotInterface): boolean {
        return (
            this.snapshot.state === next.state &&
            this.snapshot.statusText === next.statusText &&
            this.snapshot.downloadPercent === next.downloadPercent &&
            this.snapshot.errorMessage === next.errorMessage
        );
    }

    private getErrorSource(chatError: string | null, embeddingError: string | null): string {
        if (isDefined(chatError)) {
            return 'chat';
        }
        if (isDefined(embeddingError)) {
            return 'embedding';
        }

        return 'stt';
    }
}

export const aiUmbrellaStatusService = new AiUmbrellaStatusService();
