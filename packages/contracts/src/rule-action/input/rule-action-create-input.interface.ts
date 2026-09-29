import type { RuleActionCreateInputSchema } from '../schema/rule-action-create-input.schema';
import type { Mutable } from 'effect/Types';

export type RuleActionCreateInputInterface = Mutable<typeof RuleActionCreateInputSchema.Type>;
