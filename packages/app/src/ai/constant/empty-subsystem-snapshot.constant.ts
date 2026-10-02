import { AiSubsystemCardStateEnum } from '../enum/ai-subsystem-card-state.enum';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';

export const EMPTY_SUBSYSTEM_SNAPSHOT: AiSubsystemStatusSnapshotInterface = {
    state: AiSubsystemCardStateEnum.HIDDEN,
    statusText: '',
    percent: 0,
    pending: 0,
    total: 0,
    errorMessage: null
};
