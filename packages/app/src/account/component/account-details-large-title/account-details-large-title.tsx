import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'debtType' | 'icon' | 'title' | 'type'>;
}

const descriptionVariants = cva('text-xs uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const AccountDetailsLargeTitle = ({ account }: Props) => {
    const { t } = useLingui();

    const variant = ACCOUNT_COLOR[account.type];
    const description =
        account.debtType === AccountDebtTypeEnum.INSTALLMENT ? t(ACCOUNT_DEBT_TYPE[account.debtType]) : t(ACCOUNT_TYPE[account.type]);

    return (
        <View className="flex-row items-center gap-x-md">
            <CircleIcon icon={account.icon} variant={variant} size={44} iconSize={22} radius={14} />

            <View className="min-w-0 flex-1 gap-y-xs">
                <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                    {account.title}
                </Text>
                <Text className={descriptionVariants({ variant })} numberOfLines={1}>
                    {description}
                </Text>
            </View>
        </View>
    );
};
