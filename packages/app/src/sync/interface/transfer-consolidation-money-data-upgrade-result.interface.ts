import type { TransferConsolidationProgressSnapshotInterface } from './transfer-consolidation-progress-snapshot.interface';

export interface TransferConsolidationMoneyDataUpgradeResultInterface {
    readonly after: TransferConsolidationProgressSnapshotInterface;
    readonly before: TransferConsolidationProgressSnapshotInterface;
    readonly consolidated: number;
    readonly found: number;
}
