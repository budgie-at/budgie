import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

export class AiNotReadyError extends Error {
    constructor(subsystem: AiSubsystemNameEnum) {
        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
        super(`AI subsystem "${subsystem}" is not ready`);
        // eslint-disable-next-line lingui/no-unlocalized-strings -- Error class name, not user-facing
        this.name = 'AiNotReadyError';
    }
}
