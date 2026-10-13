import type { Workload } from '../../@generic/service/workload.service';
import type { Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as HttpClient from 'effect/http/HttpClient';

export interface SyncTaskServiceInterface {
    readonly sync: (deadlineAtMs: number) => Effect.Effect<boolean, unknown, Db | HttpClient.HttpClient | Workload>;
}
