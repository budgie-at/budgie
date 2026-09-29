import * as Effect from 'effect/Effect';

import { runInWorkload } from './run-in-workload';

export const flushWorkload = (): Promise<void> => runInWorkload(Effect.void);
