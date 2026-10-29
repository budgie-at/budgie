import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';

export interface PinSetupStateInterface {
    readonly step: PinSetupStepEnum;
    readonly input: string;
    readonly error: string | null;
    readonly tempNewPin: string;
}
