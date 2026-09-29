import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import * as Semaphore from 'effect/Semaphore';

import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { ProgressSnapshotInterface } from '../interface/progress-snapshot.interface';

import type { Db, DbError } from '@budgie/contracts';

export class ProgressStore {
    private static readonly FULL_PERCENT = 100;

    readonly snapshot = Atom.keepAlive(Atom.make<ProgressSnapshotInterface>({ percent: 0, pending: 0, total: 0 }));

    readonly refresh = Effect.fn('ProgressStore.refresh')(
        function* (this: ProgressStore) {
            if (Date.now() - this.lastRefreshAt < this.throttleMs) {
                return;
            }
            this.lastRefreshAt = Date.now();
            const [total, pending] = yield* this.countTotalAndPending;
            const percent = total === 0 ? ProgressStore.FULL_PERCENT : Math.round(((total - pending) / total) * ProgressStore.FULL_PERCENT);
            aiAtomRegistry.set(this.snapshot, { percent, pending, total });
        },
        effect => this.lock.withPermit(Effect.ignore(effect))
    );

    private readonly lock = Semaphore.makeUnsafe(1);
    private lastRefreshAt = 0;

    constructor(
        private readonly countTotalAndPending: Effect.Effect<readonly [number, number], DbError, Db>,
        private readonly throttleMs: number
    ) {}
}
