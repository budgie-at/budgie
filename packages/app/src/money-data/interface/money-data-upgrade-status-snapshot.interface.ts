import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';

export interface MoneyDataUpgradeStatusSnapshotInterface {
    readonly title: string;
    readonly statusText: string;
    readonly percent: number;
    readonly state: MoneyDataUpgradeProgressStateEnum;
}
