import type { EntityOperationEnum } from '../enum/entity-operation.enum';

export interface EntityFormStatusInterface {
    readonly isReady: boolean;
    readonly isLoading: boolean;
    readonly isDisabled: boolean;
    readonly isBusy: boolean;
    readonly mutatingOperation: EntityOperationEnum | null;
    readonly isUsageFailure: boolean;
    readonly isUsagePending: boolean;
    readonly onRetryUsage: () => void;
}
