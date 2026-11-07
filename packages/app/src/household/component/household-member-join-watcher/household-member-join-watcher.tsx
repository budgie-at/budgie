import { useLingui } from '@lingui/react/macro';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Schedule from 'effect/Schedule';
import { NotificationFeedbackType } from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useRef } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ICloudParticipantAcceptanceStatus, ICloudParticipantRole } from '../../../../modules/icloud';
import { appAtomRegistry } from '../../../@generic/constant/app-atom-registry.constant';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showSuccessToast } from '../../../@generic/utils/show-success-toast/show-success-toast';
import { householdRefreshAtom } from '../../constant/household-refresh-atom.constant';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';

const PARTICIPANTS_POLL_INTERVAL = Duration.seconds(15);

const pollParticipants = Effect.sync(() => {
    appAtomRegistry.update(householdRefreshAtom, count => count + 1);
}).pipe(Effect.delay(PARTICIPANTS_POLL_INTERVAL), Effect.repeat(Schedule.forever));

export const HouseholdMemberJoinWatcher = () => {
    const { t } = useLingui();
    const { otherParticipants, isKnown } = useHouseholdParticipants();
    const [hapticNotification] = useVibration();
    const acceptedCountRef = useRef<number | null>(null);

    const acceptedMembers = otherParticipants.filter(
        participant =>
            participant.role !== ICloudParticipantRole.OWNER && participant.acceptanceStatus === ICloudParticipantAcceptanceStatus.ACCEPTED
    );
    const acceptedCount = acceptedMembers.length;
    const latestName = acceptedMembers.at(-1)?.displayName;

    const announceJoin = useEffectEvent(() => {
        const name = isNotEmptyString(latestName) ? latestName : t`A family member`;

        hapticNotification(NotificationFeedbackType.Success);
        showSuccessToast(t`${name} joined your family`);
    });

    useEffect(() => {
        if (!isKnown) {
            return;
        }

        if (isDefined(acceptedCountRef.current) && acceptedCount > acceptedCountRef.current) {
            announceJoin();
        }

        acceptedCountRef.current = acceptedCount;
    }, [acceptedCount, isKnown]);

    useFocusEffect(
        useCallback(() => {
            const fiber = appRuntime.runFork(pollParticipants);

            return () => void appRuntime.runFork(Fiber.interrupt(fiber));
        }, [])
    );

    return null;
};
