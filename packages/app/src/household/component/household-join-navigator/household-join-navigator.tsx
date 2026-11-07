import { useAtomValue } from '@effect/atom-react/Hooks';
import { NotificationFeedbackType } from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { householdJoinAtom } from '../../constant/household-join-atom.constant';
import { HouseholdJoinStatusEnum } from '../../enum/household-join-status.enum';

export const HouseholdJoinNavigator = () => {
    const status = useAtomValue(householdJoinAtom, ({ status: joinStatus }) => joinStatus);
    const [hapticNotification] = useVibration();

    const handleStatusChange = useEffectEvent((next: HouseholdJoinStatusEnum) => {
        if (next === HouseholdJoinStatusEnum.JOINED) {
            hapticNotification(NotificationFeedbackType.Success);
        }

        router.navigate('/settings/family');
    });

    useEffect(() => {
        if (status === HouseholdJoinStatusEnum.JOINING || status === HouseholdJoinStatusEnum.JOINED) {
            handleStatusChange(status);
        }
    }, [status]);

    return null;
};
