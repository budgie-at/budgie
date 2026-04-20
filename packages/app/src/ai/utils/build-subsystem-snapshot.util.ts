import { AiSubsystemCardStateEnum } from '../enum/ai-subsystem-card-state.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';

interface ProgressLikeInterface {
    readonly percent: number;
    readonly pending: number;
    readonly total: number;
}

interface Labels {
    readonly boosting: string;
    readonly working: string;
    readonly ready: string;
}

export const buildSubsystemSnapshot = (
    drainer: DrainerSnapshotInterface,
    progress: ProgressLikeInterface,
    labels: Labels
): AiSubsystemStatusSnapshotInterface => {
    const base = { percent: progress.percent, pending: progress.pending, total: progress.total };

    if (drainer.state === DrainerStateEnum.Error) {
        return {
            state: AiSubsystemCardStateEnum.ERROR,
            statusText: drainer.errorMessage ?? '',
            errorMessage: drainer.errorMessage,
            ...base
        };
    }

    if (drainer.state === DrainerStateEnum.Boosting) {
        return { state: AiSubsystemCardStateEnum.BOOSTING, statusText: labels.boosting, errorMessage: null, ...base };
    }

    if (progress.pending > 0) {
        return { state: AiSubsystemCardStateEnum.WORKING, statusText: labels.working, errorMessage: null, ...base };
    }

    return { state: AiSubsystemCardStateEnum.READY, statusText: labels.ready, errorMessage: null, ...base };
};
