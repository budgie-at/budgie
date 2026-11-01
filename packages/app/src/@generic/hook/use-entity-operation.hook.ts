import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { useSingleFlight } from './use-single-flight.hook';

import type { EntityOperationEnum } from '../enum/entity-operation.enum';
import type { AppServices } from '../runtime/app.runtime';
import type { MutationTracker } from '../type/mutation-tracker.type';

export const useEntityOperation = () => {
    const { run, isLoading } = useSingleFlight();
    const [mutatingOperation, setMutatingOperation] = useState<EntityOperationEnum | null>(null);

    const start = <A, E>(operation: EntityOperationEnum, action: (trackMutation: MutationTracker) => Effect.Effect<A, E, AppServices>) =>
        void run(
            action(mutation =>
                Effect.sync(() => void setMutatingOperation(operation)).pipe(
                    Effect.andThen(mutation),
                    Effect.ensuring(Effect.sync(() => void setMutatingOperation(null)))
                )
            )
        );

    return { isPending: isLoading, mutatingOperation, start };
};
