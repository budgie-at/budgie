import { isDefined } from '@rnw-community/shared';

import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { aiLog } from '../utils/ai-log.util';

class DrainerMutexService {
    private heldBy: DrainerKindEnum | null = null;

    get holder(): DrainerKindEnum | null {
        return this.heldBy;
    }

    acquire(kind: DrainerKindEnum): boolean {
        if (!isDefined(this.heldBy)) {
            this.heldBy = kind;
            aiLog('drainer:mutex:acquire', { kind });

            return true;
        }

        return this.heldBy === kind;
    }

    release(kind: DrainerKindEnum): void {
        if (this.heldBy === kind) {
            this.heldBy = null;
            aiLog('drainer:mutex:release', { kind });
        }
    }

    isHeldBy(kind: DrainerKindEnum): boolean {
        return this.heldBy === kind;
    }
}

export const drainerMutex = new DrainerMutexService();
