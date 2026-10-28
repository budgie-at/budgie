import { AccountDebtTypeEnum, AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'icon' | 'title' | 'type' | 'debtType'>;
    readonly right: ReactNode;
    readonly onGoBack: EmptyFn;
}

const descriptionVariants = cva('text-xs uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const AccountDetailsHeader = ({ account, right, onGoBack }: Props) => {
    const { t } = useLingui();

    const accountColor = ACCOUNT_COLOR[account.type];
    const accountDescription =
        account.debtType === AccountDebtTypeEnum.INSTALLMENT ? t(ACCOUNT_DEBT_TYPE[account.debtType]) : t(ACCOUNT_TYPE[account.type]);

    return (
        <PageHeader
            left={<CircleIcon icon={account.icon} variant={accountColor} size={50} iconSize={24} radius={16} className="rounded-3xl" />}
            onGoBack={onGoBack}
            title={account.title}
            right={right}
        >
            <Text className={descriptionVariants({ variant: accountColor })}>{accountDescription}</Text>
        </PageHeader>
    );
};
