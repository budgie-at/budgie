import { deriveSyncId } from './derive-sync-id.util';

const SEED_NAMESPACE = '0f81afd8-5cb0-4746-9cab-e2d257679e06';

export const deriveSeedSyncId = (seedKey: string): string => deriveSyncId(SEED_NAMESPACE, seedKey);
