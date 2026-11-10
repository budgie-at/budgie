import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { EntityOperationEnum } from '../enum/entity-operation.enum';

import { useEntityOperation } from './use-entity-operation.hook';
import { useEntityUsage } from './use-entity-usage.hook';
import { useSingleFlight } from './use-single-flight.hook';

import type { EntityFormStatusInterface } from '../interface/entity-form-status.interface';
import type { EntityUsageRowInterface } from '../interface/entity-usage-row.interface';
import type { AppServices } from '../runtime/app.runtime';
import type { MutationTracker } from '../type/mutation-tracker.type';
import type * as AsyncResult from 'effect/reactivity/AsyncResult';
import type * as Atom from 'effect/reactivity/Atom';

export const useEntityFormState = <E>(
    entityId: number | undefined,
    usageAtom: Atom.Atom<AsyncResult.AsyncResult<readonly EntityUsageRowInterface[], E>>,
    title: string,
    onDeleted: () => void
) => {
    const saveFlight = useSingleFlight();
    const operation = useEntityOperation();
    const { usage, isUsagePending, isUsageFailure, retryUsage } = useEntityUsage(usageAtom);
    const isBusy = saveFlight.isLoading || operation.isPending;
    const hasTitle = isNotEmptyString(title.trim());
    const status: EntityFormStatusInterface = {
        isReady: hasTitle,
        isLoading: saveFlight.isLoading,
        isDisabled: !hasTitle || isBusy,
        isBusy,
        mutatingOperation: operation.mutatingOperation,
        isUsageFailure,
        isUsagePending,
        onRetryUsage: retryUsage
    };

    const startDelete = <DeleteError>(
        deleteEntity: (id: number, trackMutation: MutationTracker) => Effect.Effect<boolean, DeleteError, AppServices>
    ) => {
        if (isDefined(entityId) && !isBusy) {
            operation.start(EntityOperationEnum.DELETE, trackMutation =>
                deleteEntity(entityId, trackMutation).pipe(Effect.tap(isDeleted => (isDeleted ? Effect.sync(onDeleted) : Effect.void)))
            );
        }
    };

    return {
        status,
        runSave: saveFlight.run,
        startOperation: operation.start,
        transactionCount: usage?.find(entry => entry.id === entityId)?.transactionCount ?? 0,
        startDelete
    };
};
