import { UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly kind: AccountSwitchFieldKindEnum;
    readonly value: boolean | undefined;
    readonly onChange: (value: boolean) => void;
}

const FIELDS = {
    [AccountSwitchFieldKindEnum.INCLUDE_IN_NET_WORTH]: {
        icon: UserIconNameEnum.ChartPie,
        title: msg`Include in net worth`,
        subtitle: msg`Count it in your net worth`,
        testID: CreateAccountScreenSelector.IncludeInNetWorthRow,
        titleTestID: CreateAccountScreenSelector.IncludeInNetWorthTitle,
        switchTestID: CreateAccountScreenSelector.IncludeInNetWorthSwitch
    },
    [AccountSwitchFieldKindEnum.SHOW_ON_HOME]: {
        icon: UserIconNameEnum.Home,
        title: msg`Show on Home`,
        subtitle: msg`List it on the Home screen`,
        testID: CreateAccountScreenSelector.ActiveRow,
        titleTestID: CreateAccountScreenSelector.ActiveTitle,
        switchTestID: CreateAccountScreenSelector.ActiveSwitch
    }
} as const;

export const AccountSwitchField = ({ kind, value, onChange }: Props) => {
    const { t } = useLingui();
    const { icon, title, subtitle, testID, titleTestID, switchTestID } = FIELDS[kind];

    return (
        <GroupedListSwitchRow
            icon={icon}
            title={t(title)}
            subtitle={t(subtitle)}
            value={value}
            testID={testID}
            titleTestID={titleTestID}
            switchTestID={switchTestID}
            onChange={onChange}
        />
    );
};
