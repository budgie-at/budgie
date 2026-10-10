import { t } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';

export class AiModelStorageBusyError extends Schema.TaggedError<AiModelStorageBusyError>()('AiModelStorageBusyError', {}) {
    override get message(): string {
        return t`AI is downloading or opening this model. Try again when it finishes.`;
    }
}
