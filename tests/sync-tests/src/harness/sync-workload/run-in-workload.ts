import { Workload } from '@app/@generic/service/workload.service';
import * as Effect from 'effect/Effect';

import type { Db } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export const inWorkload = <A, E>(effect: Effect.Effect<A, E, Db | HttpClient.HttpClient | Workload>): Effect.Effect<A, E, Workload> =>
    Effect.flatMap(Workload, workload => workload.run(effect));
