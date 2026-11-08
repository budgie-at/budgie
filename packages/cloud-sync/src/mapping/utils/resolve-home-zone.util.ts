import { PERSONAL_SYNC_ZONE } from '@budgie/contracts';

export const resolveHomeZone = (entryZones: readonly string[], parentZone: string): string => {
    if (entryZones.includes(PERSONAL_SYNC_ZONE)) {
        return PERSONAL_SYNC_ZONE;
    }

    return entryZones.includes(parentZone) ? parentZone : entryZones[0];
};
