import { Workload } from '@app/@generic/service/workload.service';

import { run } from '../scenario/test-runtime';

import type { Services } from '../scenario/test-runtime';
import type * as Effect from 'effect/Effect';

export const runInWorkload = <A, E>(effect: Effect.Effect<A, E, Services>): Promise<A> =>
    run(Workload.use(workload => workload.run(effect)));
