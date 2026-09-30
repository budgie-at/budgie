import type { Workload } from '../../@generic/service/workload.service';
import type { Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export type CategorizeInboxEnqueueWriteType = (
    write: Effect.Effect<unknown, unknown, Db | Workload>,
    rollback: () => void,
    failedMessage: string
) => void;
