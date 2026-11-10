import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { EntityFormStatusInterface } from '../interface/entity-form-status.interface';

export const EntityFormStatusContext = createContext<EntityFormStatusInterface>({
    isReady: false,
    isLoading: false,
    isDisabled: true,
    isBusy: false,
    mutatingOperation: null,
    isUsageFailure: false,
    isUsagePending: false,
    onRetryUsage: emptyFn
});
