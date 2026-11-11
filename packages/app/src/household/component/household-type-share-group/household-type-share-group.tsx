import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';
import { ACCOUNT_TYPE_SWATCH } from '../../../account/constant/account-type-swatch.constant';
import { ACCOUNT_TYPE } from '../../../account/constant/account-type.constant';
import { HouseholdAccountShareGroupRow } from '../household-account-share-group-row/household-account-share-group-row';

import type { HouseholdAccountShareGroupInterface } from '../../interface/household-account-share-group.interface';

interface Props extends Pick<HouseholdAccountShareGroupInterface, 'type' | 'accounts'> {
    readonly groupKey: string;
}

export const HouseholdTypeShareGroup = ({ groupKey, type, accounts }: Props) => {
    const { t } = useLingui();

    const swatch = ACCOUNT_TYPE_SWATCH[type];

    return (
        <HouseholdAccountShareGroupRow
            groupKey={groupKey}
            title={t(ACCOUNT_TYPE[type])}
            left={
                <CircleIcon
                    icon={ACCOUNT_ICON[type]}
                    variant="ghost"
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className={swatch.soft}
                    iconClassName={swatch.text}
                />
            }
            accounts={accounts}
        />
    );
};
