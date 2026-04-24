import { LoggerNamespaceEnum, getLogger } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { DrainerKindEnum } from '../enum/drainer-kind.enum';

const logger = getLogger(LoggerNamespaceEnum.AI);

class DrainerMutexService {
    private heldBy: DrainerKindEnum | null = null;

    get holder(): DrainerKindEnum | null {
        return this.heldBy;
    }

    acquire(kind: DrainerKindEnum): boolean {
        if (!isDefined(this.heldBy)) {
            this.heldBy = kind;
            logger.log('drainer:mutex:acquire', { kind });

            return true;
        }

        return this.heldBy === kind;
    }

    release(kind: DrainerKindEnum): void {
        if (this.heldBy === kind) {
            this.heldBy = null;
            logger.log('drainer:mutex:release', { kind });
        }
    }

    isHeldBy(kind: DrainerKindEnum): boolean {
        return this.heldBy === kind;
    }
}

export const drainerMutex = new DrainerMutexService();
