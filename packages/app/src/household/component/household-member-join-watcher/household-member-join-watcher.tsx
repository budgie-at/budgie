import { useLingui } from '@lingui/react/macro';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Schedule from 'effect/Schedule';
import { useFocusEffect } from 'expo-router';
import { useEffect, useEffectEvent, useRef } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRegistry } from '../../../@generic/constant/app-atom-registry.constant';
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
    const { joinedMembers, isKnown } = useHouseholdParticipants();
    const joinedCountRef = useRef<number | null>(null);

    const joinedCount = joinedMembers.length;
    const latestName = joinedMembers.at(-1)?.displayName;

    const announceJoin = useEffectEvent(() => {
        const name = isNotEmptyString(latestName) ? latestName : t`A family member`;

        showSuccessToast(t`${name} joined your family`);
    });

    useEffect(() => {
        if (!isKnown) {
            return;
        }

        if (isDefined(joinedCountRef.current) && joinedCount > joinedCountRef.current) {
            announceJoin();
        }

        joinedCountRef.current = joinedCount;
    }, [joinedCount, isKnown]);

    useFocusEffect(() => {
        const fiber = appRuntime.runFork(pollParticipants);

        return () => void appRuntime.runFork(Fiber.interrupt(fiber));
    });

    return null;
};
