import type { SetupStepEnum } from '../enum/setup-step.enum';
import type { SyncAccountPreviewInterface } from '@budgie/sync';

export interface CreateBinanceAccountStateInterface {
    readonly step: SetupStepEnum;
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly parkedPreviews: readonly SyncAccountPreviewInterface[];
}
