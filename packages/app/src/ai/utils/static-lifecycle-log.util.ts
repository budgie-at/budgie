import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

const logStaticLifecycleError = (error: unknown): string => ['throw', `error=${getErrorMessage(error)}`].join(' ');

export const staticLifecycleLog = Log('enter', 'done', logStaticLifecycleError);
