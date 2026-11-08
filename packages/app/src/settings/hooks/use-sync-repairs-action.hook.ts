import { SyncRepairService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useState } from 'react';

import { useProcessingHaptic } from '../../@generic/hook/use-processing-haptic.hook';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

export const useSyncRepairsAction = (refresh: () => void) => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const { isLoading: isRepairing, run } = useSingleFlight();
    const [repairedTransactionCount, setRepairedTransactionCount] = useState<number | null>(null);

    useProcessingHaptic(isRepairing);

    const handleRepair = () =>
        run(
            Effect.gen(function* () {
                const syncRepairService = yield* SyncRepairService;
                const result = yield* syncRepairService.removeDuplicates();

                setRepairedTransactionCount(result.repairedTransactionCount);
                hapticNotification(NotificationFeedbackType.Success);
                refresh();
            }).pipe(toastOnFailure(t`Could not repair sync data`))
        );

    return { handleRepair, isRepairing, repairedTransactionCount };
};
