import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

interface Props {
    readonly type: AccountTypeEnum;
    readonly total: number;
}

export const AccountSectionHeader = ({ type, total }: Props) => {
    const { t } = useLingui();

    return (
        <AccountSectionHeaderFrame total={total}>
            <Text className="text-xs uppercase text-secondary-foreground">{t(ACCOUNT_TYPE[type])}</Text>
        </AccountSectionHeaderFrame>
    );
};
