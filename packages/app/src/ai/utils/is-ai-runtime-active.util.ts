import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { aiCoordinatorSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';

export const isAiRuntimeActive = (): boolean => {
    const snapshot = appAtomRegistry.get(aiCoordinatorSnapshotAtom);

    return snapshot.isAvailable && !snapshot.isSuspended;
};
