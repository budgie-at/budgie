import { HouseholdService } from '@budgie/cloud-sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appAtomRegistry } from '../../../@generic/constant/app-atom-registry.constant';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { householdRefreshAtom } from '../../constant/household-refresh-atom.constant';

import { HouseholdRemoveButtonSelector } from './household-remove-button.selector';

import type { ICloudShareParticipant } from '@budgie/cloud-sync';

interface Props {
    readonly participants: readonly Pick<ICloudShareParticipant, 'displayName' | 'participantId'>[];
}

export const HouseholdRemoveButton = ({ participants }: Props) => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const name = participants.length === 1 ? (participants[0].displayName ?? t`this person`) : t`these invitations`;

    const handlePress = () => {
        void run(
            confirmAlert({
                title: t`Remove ${name}?`,
                message: t`They lose access to your family group. Their shared data is deleted from their device the next time it syncs, so it may stay there until they are online.`,
                confirmText: t`Remove`,
                cancelText: t`Cancel`,
                isDestructive: true
            }).pipe(
                Effect.flatMap(isConfirmed =>
                    isConfirmed
                        ? Effect.flatMap(HouseholdService, householdService =>
                              Effect.forEach(participants, participant => householdService.removeParticipant(participant.participantId), {
                                  discard: true
                              })
                          ).pipe(
                              Effect.tap(
                                  Effect.sync(() => {
                                      appAtomRegistry.update(householdRefreshAtom, count => count + 1);
                                  })
                              )
                          )
                        : Effect.void
                ),
                toastOnFailure(t`Could not remove ${name}`)
            )
        );
    };

    return (
        <SettingsPillButton
            label={t`Remove`}
            variant="secondary"
            size="sm"
            isLoading={isLoading}
            onPress={handlePress}
            testID={HouseholdRemoveButtonSelector.Button}
        />
    );
};
