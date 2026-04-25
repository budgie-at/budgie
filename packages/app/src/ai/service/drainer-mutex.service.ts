import { Log } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { DrainerKindEnum } from '../enum/drainer-kind.enum';

class DrainerMutexService {
    private heldBy: DrainerKindEnum | null = null;

    get holder(): DrainerKindEnum | null {
        return this.heldBy;
    }
    @Log(
        (kind: DrainerKindEnum) => `acquire:enter kind=${kind}`,
        (result, kind: DrainerKindEnum) => `acquire:done kind=${kind} acquired=${String(result)}`,
        (error, kind: DrainerKindEnum) => `acquire:throw kind=${kind} error=${String(error)}`
    )
    acquire(kind: DrainerKindEnum): boolean {
        if (!isDefined(this.heldBy)) {
            this.heldBy = kind;

            return true;
        }

        return this.heldBy === kind;
    }
    @Log(
        (kind: DrainerKindEnum) => `release:enter kind=${kind}`,
        (_result, kind: DrainerKindEnum) => `release:done kind=${kind}`,
        (error, kind: DrainerKindEnum) => `release:throw kind=${kind} error=${String(error)}`
    )
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
