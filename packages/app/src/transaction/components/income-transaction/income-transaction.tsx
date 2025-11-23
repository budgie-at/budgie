import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { AccountBalanceInput } from '../../../account/component/account-balance-input/account-balance-input';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const textVariants = cva('text-[72px]', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const IncomeTransaction = ({ transaction }: Props) => {
    const [amount, setAmount] = useState(convertFromMicroUnits(transaction.entries.reduce((acc, curr) => acc + curr.amount, 0)));
    const { t } = useLingui();

    const [entry] = transaction.entries;

    const instrumentSymbol = '$';

    const goBack = () => void router.back();

    return (
        <Page
            header={
                <PageHeader
                    right={
                        <HapticPressable className="p-md rounded-full active:bg-primary/1" onPress={goBack}>
                            <Icon icon={ICONS.X} size={24} className="text-secondary-foreground" />
                        </HapticPressable>
                    }
                    icon={entry.category.icon}
                    iconVariant="positive"
                    title={t`Edit`}
                    description={entry.category.title}
                />
            }
        >
            <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
                <Text className={textVariants({ variant: 'positive' })}>{instrumentSymbol} </Text>

                <AccountBalanceInput variant="positive" instrumentSymbol={instrumentSymbol} value={amount} onChange={setAmount} />
            </View>
        </Page>
    );
};
