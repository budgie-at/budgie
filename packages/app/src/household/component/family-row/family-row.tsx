import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsWarningSubtitle } from '../../../settings/components/settings-warning-subtitle/settings-warning-subtitle';
import { householdJoinAtom } from '../../constant/household-join-atom.constant';
import { HouseholdJoinStatusEnum } from '../../enum/household-join-status.enum';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { useHousehold } from '../../hook/use-household.hook';

import { FamilyRowSelector } from './family-row.selector';

const handlePress = () => void router.push('/settings/family');

export const FamilyRow = () => {
    const { t } = useLingui();
    const { isMember, isShared } = useHousehold();
    const { isAvailable } = useICloudAccount();
    const { otherParticipants } = useHouseholdParticipants();
    const { status, ownerDisplayName } = useAtomValue(householdJoinAtom);

    const hasParticipants = isNotEmptyArray(otherParticipants);
    const sharedSubtitle = t({
        message: plural(otherParticipants.length, { one: 'Shared with # person', other: 'Shared with # people' })
    });
    const roleSubtitle = isMember ? t`Shared with your family` : sharedSubtitle;
    const participantsSubtitle = isAvailable ? (
        roleSubtitle
    ) : (
        <SettingsWarningSubtitle>{t`Paused: sign in to iCloud`}</SettingsWarningSubtitle>
    );
    const groupSubtitle = hasParticipants ? participantsSubtitle : t`Not shared yet`;
    const idleSubtitle = isShared ? groupSubtitle : t`Share accounts with family`;
    const joiningSubtitle = isNotEmptyString(ownerDisplayName) ? t`Joining ${ownerDisplayName}'s family…` : t`Joining the family…`;
    const subtitle = status === HouseholdJoinStatusEnum.JOINING ? joiningSubtitle : idleSubtitle;

    return (
        <SettingsRow
            icon={UserIconNameEnum.Users}
            variant="ghost"
            title={t`Family`}
            subtitle={subtitle}
            onPress={handlePress}
            testID={FamilyRowSelector.Card}
        />
    );
};
