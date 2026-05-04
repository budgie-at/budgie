import { t } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { AiSystemUmbrellaSnapshotInterface } from '../interface/ai-system-umbrella-snapshot.interface';

import { ScheduledSnapshotStore } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';

class AiUmbrellaStatusService extends ScheduledSnapshotStore<AiSystemUmbrellaSnapshotInterface> {
    private static readonly TRUNCATE_LEN = 80;
    private static readonly SUBSYSTEM_COUNT = 3;
    private static readonly EMPTY_UMBRELLA_SNAPSHOT: AiSystemUmbrellaSnapshotInterface = {
        state: AiSystemUmbrellaStateEnum.DISABLED,
        statusText: '',
        downloadPercent: 0,
        errorMessage: null
    };

    private lastState: AiSystemUmbrellaStateEnum = AiSystemUmbrellaStateEnum.DISABLED;

    constructor() {
        super(AiUmbrellaStatusService.EMPTY_UMBRELLA_SNAPSHOT);
    }

    protected buildSubscriptions(): (() => void)[] {
        return [
            chatService.subscribe(this.scheduleRecompute),
            embeddingService.subscribe(this.scheduleRecompute),
            sttService.subscribe(this.scheduleRecompute)
        ];
    }

    protected emptySnapshot(): AiSystemUmbrellaSnapshotInterface {
        return { ...AiUmbrellaStatusService.EMPTY_UMBRELLA_SNAPSHOT };
    }

    protected recompute(): void {
        const next = this.derive();
        if (this.snapshotEquals(next)) {
            return;
        }
        if (next.state !== this.lastState) {
            this.lastState = next.state;
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

            const message = (chatError ?? embeddingError ?? sttError ?? '').slice(0, AiUmbrellaStatusService.TRUNCATE_LEN);

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
                (chat.downloadProgress + embedding.downloadProgress + stt.downloadProgress) / AiUmbrellaStatusService.SUBSYSTEM_COUNT
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

    private getErrorSource(chatError: string | null, embeddingError: string | null): AiSubsystemNameEnum {
        if (isDefined(chatError)) {
            return AiSubsystemNameEnum.CHAT;
        }
        if (isDefined(embeddingError)) {
            return AiSubsystemNameEnum.EMBEDDING;
        }

        return AiSubsystemNameEnum.STT;
    }
}

export const aiUmbrellaStatusService = new AiUmbrellaStatusService();
