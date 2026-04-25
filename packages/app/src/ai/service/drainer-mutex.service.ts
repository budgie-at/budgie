import { Log } from '@budgie/contracts';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { DrainerKindEnum } from '../enum/drainer-kind.enum';

class DrainerMutexService {
    private heldBy: DrainerKindEnum | null = null;

    get holder(): DrainerKindEnum | null {
        return this.heldBy;
    }

    @Log(
        kind => `enter kind=${kind}`,
        (result, kind) => `done kind=${kind} acquired=${String(result)}`,
        (error, kind) => `throw kind=${kind} error=${getErrorMessage(error)}`
    )
    acquire(kind: DrainerKindEnum): boolean {
        if (!isDefined(this.heldBy)) {
            this.heldBy = kind;

            return true;
        }

        return this.heldBy === kind;
    }

    @Log(kind => `enter kind=${kind}`, 'done', (error, kind) => `throw kind=${kind} error=${getErrorMessage(error)}`)
    release(kind: DrainerKindEnum): void {
        if (this.heldBy === kind) {
            this.heldBy = null;
        }
    }

    isHeldBy(kind: DrainerKindEnum): boolean {
        return this.heldBy === kind;
    }
}

export const drainerMutex = new DrainerMutexService();
