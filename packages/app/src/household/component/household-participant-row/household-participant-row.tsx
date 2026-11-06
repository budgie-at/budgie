import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { ICloudParticipantAcceptanceStatus, ICloudParticipantRole } from '../../../../modules/icloud';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import { HouseholdParticipantRowSelector } from './household-participant-row.selector';

import type { ICloudShareParticipant } from '../../../../modules/icloud';
import type { ReactNode } from 'react';

interface Props {
    readonly participant: ICloudShareParticipant;
    readonly children?: ReactNode;
}

export const HouseholdParticipantRow = ({ participant, children }: Props) => {
    const { t } = useLingui();
    const isOwner = participant.role === ICloudParticipantRole.OWNER;
    const isPending = participant.acceptanceStatus === ICloudParticipantAcceptanceStatus.PENDING;
    const fallbackName = participant.isCurrentUser ? t`You` : t`Family member`;
    const title = isNotEmptyString(participant.displayName) ? participant.displayName : fallbackName;
    const roleLabel = isOwner ? t`Organizer` : isPending ? t`Invitation pending` : t`Member`;
    const icon = isOwner ? UserIconNameEnum.Crown : UserIconNameEnum.UserRound;

    return (
        <SettingsRow
            icon={icon}
            variant="ghost"
            title={title}
            testID={HouseholdParticipantRowSelector.Card}
            right={children}
            subtitle={roleLabel}
        />
    );
};
