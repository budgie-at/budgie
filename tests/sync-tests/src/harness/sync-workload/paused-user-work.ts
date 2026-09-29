import { Workload } from '@app/@generic/service/workload.service';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';

import { emptyFn } from '@rnw-community/shared';

import { run } from '../scenario/test-runtime';

export class PausedUserWork {
    readonly started: Promise<void>;
    readonly work: Promise<void>;

    private readonly releaseSignal = Deferred.makeUnsafe<void>();

    constructor(onStart: () => void = emptyFn) {
        const startedSignal = Deferred.makeUnsafe<void>();
        const { releaseSignal } = this;

        this.started = run(Deferred.await(startedSignal));
        this.work = run(
            Effect.gen(function* () {
                const workload = yield* Workload;

                yield* workload.runUser(
                    Effect.gen(function* () {
                        onStart();
                        yield* Deferred.succeed(startedSignal, undefined);
                        yield* Deferred.await(releaseSignal);
                    })
                );
            })
        );
    }

    release(): void {
        Deferred.doneUnsafe(this.releaseSignal, Effect.void);
    }
}
