import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';
import { MoneyDataUpgradeStepEnum } from '../enum/money-data-upgrade-step.enum';

export interface MoneyDataUpgradeStepSnapshotInterface {
    readonly key: MoneyDataUpgradeStepEnum;
    readonly title: string;
    readonly statusText: string;
    readonly percent: number;
    readonly state: MoneyDataUpgradeProgressStateEnum;
}
