import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';

import type { MoneyDataUpgradeStepSnapshotInterface } from './money-data-upgrade-step-snapshot.interface';

export interface MoneyDataUpgradeStatusSnapshotInterface {
    readonly title: string;
    readonly statusText: string;
    readonly percent: number;
    readonly state: MoneyDataUpgradeProgressStateEnum;
    readonly primaryActionText: string;
    readonly steps: readonly MoneyDataUpgradeStepSnapshotInterface[];
}
