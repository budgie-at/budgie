import type { RuleCreateInputSchema } from '../schema/rule-create-input.schema';
import type { Mutable } from 'effect/Types';

export type RuleCreateInputInterface = Mutable<typeof RuleCreateInputSchema.Type>;
