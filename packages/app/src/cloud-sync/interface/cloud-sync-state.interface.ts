import type { CloudSyncRestorePhaseEnum } from '../enum/cloud-sync-restore-phase.enum';

export interface CloudSyncStateInterface {
    readonly boundUserRecordName: string | null;
    readonly stateSerialization: string | null;
    readonly resolvedLineageId: string | null;
    readonly restorePhase: CloudSyncRestorePhaseEnum;
}
