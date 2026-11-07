import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { HouseholdRemoveButton } from '../household-remove-button/household-remove-button';

import { HouseholdPendingInvitesRowSelector } from './household-pending-invites-row.selector';

import type { ICloudShareParticipant } from '../../../../modules/icloud';

interface Props {
    readonly participants: readonly ICloudShareParticipant[];
}

export const HouseholdPendingInvitesRow = ({ participants }: Props) => {
    const { t } = useLingui();

    if (!isNotEmptyArray(participants)) {
        return null;
    }

    const isSingle = participants.length === 1;
    const manyTitle = t({
        message: plural(participants.length, { one: '# invitation waiting to be opened', other: '# invitations waiting to be opened' })
    });
    const title = isSingle ? t`Family member` : manyTitle;
    const subtitle = isSingle ? t`Waiting for them to open the invite` : t`Each link works for one person`;

    return (
        <SettingsRow
            icon={UserIconNameEnum.UserRound}
            variant="ghost"
            title={title}
            subtitle={subtitle}
            right={<HouseholdRemoveButton participants={participants} />}
            testID={HouseholdPendingInvitesRowSelector.Card}
        />
    );
};
