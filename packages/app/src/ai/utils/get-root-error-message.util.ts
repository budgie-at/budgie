import * as Predicate from 'effect/Predicate';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

export const getRootErrorMessage = (error: unknown): string =>
    Predicate.hasProperty(error, 'cause') && isDefined(error.cause) ? getRootErrorMessage(error.cause) : getErrorMessage(error);
