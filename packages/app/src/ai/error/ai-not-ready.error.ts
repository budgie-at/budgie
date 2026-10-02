import * as Schema from 'effect/Schema';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

export class AiNotReadyError extends Schema.TaggedError<AiNotReadyError>()('AiNotReadyError', {
    subsystem: Schema.Enum(AiSubsystemNameEnum)
}) {
    override get message(): string {
        // oxlint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
        return `AI subsystem "${this.subsystem}" is not ready`;
    }
}
