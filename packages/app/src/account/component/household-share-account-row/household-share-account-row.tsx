import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useHouseholdParticipants } from '../../../household/hook/use-household-participants.hook';
import { HouseholdShareSelector } from '../household-share-account-section/household-share-account-section.selector';

interface Props {
    readonly value: boolean;
    readonly onChange: (value: boolean) => void;
}

export const HouseholdShareAccountRow = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const { otherParticipants, isKnown } = useHouseholdParticipants();
    const { isAvailable } = useICloudAccount();

    const subtitle = isAvailable && isKnown && isNotEmptyArray(otherParticipants) ? t`Family can edit it` : t`Family you invite can edit it`;

    return (
        <GroupedListSwitchRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Share this account`}
            subtitle={subtitle}
            value={value}
            accessibilityHint={t`Saved when you tap Save changes`}
            testID={HouseholdShareSelector.AccountRow}
            switchTestID={HouseholdShareSelector.AccountSwitch}
            onChange={onChange}
        />
    );
};
