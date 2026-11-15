import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

import type { ReactNode } from 'react';

interface Props {
    readonly type: AccountTypeEnum;
    readonly total: number | null;
    readonly children?: ReactNode;
}

export const AccountSectionHeader = ({ type, total, children }: Props) => {
    const { t } = useLingui();

    return (
        <AccountSectionHeaderFrame
            title={t(ACCOUNT_TYPE[type])}
            total={total}
            leading={<View className={cn('size-[8px] rounded-full', ACCOUNT_TYPE_SWATCH[type].fill)} />}
        >
            {children}
        </AccountSectionHeaderFrame>
    );
};
