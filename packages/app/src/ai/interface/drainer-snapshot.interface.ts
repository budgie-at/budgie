import { DrainerStateEnum } from '../enum/drainer-state.enum';

export interface DrainerSnapshotInterface {
    readonly state: DrainerStateEnum;
    readonly pending: number;
    readonly lastDurationMs: number;
    readonly errorMessage: string | null;
}
