import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

interface Props {
    readonly type: AccountTypeEnum;
    readonly total: number;
}

export const AccountSectionHeader = ({ type, total }: Props) => {
    const { t } = useLingui();

    return <AccountSectionHeaderFrame title={t(ACCOUNT_TYPE[type])} total={total} />;
};
