import { HouseholdJoinStatusEnum } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { NotificationFeedbackType } from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { householdJoinAtom } from '../../constant/household-join-atom.constant';

export const HouseholdJoinNavigator = () => {
    const status = useAtomValue(householdJoinAtom, ({ status: joinStatus }) => joinStatus);
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const [hapticNotification] = useVibration();

    const handleStatusChange = useEffectEvent((next: HouseholdJoinStatusEnum) => {
        if (next === HouseholdJoinStatusEnum.JOINED) {
            hapticNotification(NotificationFeedbackType.Success);
        }

        router.navigate('/settings/family');
    });

    useEffect(() => {
        if (isOnboardingCompleted && (status === HouseholdJoinStatusEnum.JOINING || status === HouseholdJoinStatusEnum.JOINED)) {
            handleStatusChange(status);
        }
    }, [status, isOnboardingCompleted]);

    return null;
};
