import type { MoneyDataUpgradeRuntimeSnapshotInterface } from './money-data-upgrade-runtime-snapshot.interface';
import type { PendingBaseValuationBucketInterface } from '@budgie/contracts';

export interface MoneyDataUpgradeBucketsInputInterface {
    readonly buckets: PendingBaseValuationBucketInterface[];
    readonly bucketIndex: number;
    readonly baseInstrumentId: number;
    readonly onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void;
}
