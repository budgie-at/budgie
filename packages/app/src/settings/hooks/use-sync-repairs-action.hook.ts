import { SyncRepairService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

export const useSyncRepairsAction = (refresh: () => void) => {
    const { t } = useLingui();
    const { isLoading: isRepairing, run } = useSingleFlight();
    const [repairedTransactionCount, setRepairedTransactionCount] = useState<number | null>(null);

    const handleRepair = () =>
        run(
            Effect.gen(function* () {
                const syncRepairService = yield* SyncRepairService;
                const result = yield* syncRepairService.removeDuplicates();

                setRepairedTransactionCount(result.repairedTransactionCount);
                refresh();
            }).pipe(toastOnFailure(t`Could not repair sync data`))
        );

    return { handleRepair, isRepairing, repairedTransactionCount };
};
