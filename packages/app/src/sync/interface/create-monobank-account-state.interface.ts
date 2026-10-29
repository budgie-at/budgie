import type { SetupStepEnum } from '../enum/setup-step.enum';
import type { SyncHistoryDepthEnum } from '@budgie/sync';

export interface CreateMonobankAccountStateInterface {
    readonly step: SetupStepEnum;
    readonly token: string;
    readonly historyDepth: SyncHistoryDepthEnum;
}
