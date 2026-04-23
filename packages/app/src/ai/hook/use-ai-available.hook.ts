import { useSyncExternalStore } from 'react';

import { aiCoordinatorService } from '../service/ai-coordinator.service';

const getIsAvailable = (): boolean => aiCoordinatorService.getSnapshot().isAvailable;

export const useAiAvailable = (): boolean => useSyncExternalStore(aiCoordinatorService.subscribe, getIsAvailable);
