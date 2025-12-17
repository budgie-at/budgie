import { MessageDescriptor } from '@lingui/core';

import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';

export interface PinSetupStateInterface {
    mode: PinSetupModeEnum;
    step: PinSetupStepEnum;
    input: string;
    tempNewPin: string;
    isLoading: boolean;
    error: MessageDescriptor | null;
    justCompleted: boolean;
}
