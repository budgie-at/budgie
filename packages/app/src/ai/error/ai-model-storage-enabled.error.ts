import { t } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';

export class AiModelStorageEnabledError extends Schema.TaggedError<AiModelStorageEnabledError>()('AiModelStorageEnabledError', {}) {
    override get message(): string {
        return t`AI was turned on again before cleanup finished. Turn AI off and try removing the model again.`;
    }
}
