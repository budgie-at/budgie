import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';

interface Props {
    readonly includeInNetWorth: boolean | undefined;
    readonly onIncludeInNetWorthChange: (value: boolean) => void;
    readonly children?: ReactNode;
}

export const CreateAccountOptionsSection = ({ includeInNetWorth, onIncludeInNetWorthChange, children }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListSection title={t`Options`} footer={t`You can rename it and change options later.`}>
            <AccountSwitchField
                kind={AccountSwitchFieldKindEnum.INCLUDE_IN_NET_WORTH}
                value={includeInNetWorth}
                onChange={onIncludeInNetWorthChange}
            />
            {children}
        </GroupedListSection>
    );
};
