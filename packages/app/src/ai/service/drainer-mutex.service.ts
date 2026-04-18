import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { aiLog } from '../utils/ai-log.util';

class DrainerMutexService {
    private heldBy: DrainerKindEnum | null = null;

    acquire(kind: DrainerKindEnum): boolean {
        if (this.heldBy === null) {
            this.heldBy = kind;
            aiLog('drainer:mutex:acquire', { kind });

            return true;
        }
        if (this.heldBy === kind) {
            return true;
        }
        aiLog('drainer:mutex:deny', { held: this.heldBy, requested: kind });

        return false;
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

    get holder(): DrainerKindEnum | null {
        return this.heldBy;
    }
}

export const drainerMutex = new DrainerMutexService();
