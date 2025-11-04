import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { CreateAccountCard } from '../create-account-card/create-account-card';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Ref } from 'react';

interface CreateAccountBottomSheetPropsInterface {
    readonly ref: Ref<BottomSheetModal>;
}

export const CreateAccountBottomSheet = ({ ref }: CreateAccountBottomSheetPropsInterface) => {
    const { t } = useLingui();

    const accountTypes = [
        {
            title: t`Expense`,
            variant: 'destructive',
            icon: 'TrendingDown',
            description: t`Money you spend`
        },
        {
            title: t`Income`,
            variant: 'positive',
            icon: 'TrendingUp',
            description: t`Money you earn`
        },
        {
            title: t`Transfer`,
            variant: 'default',
            icon: 'ArrowRightLeft',
            description: t`Move between accounts`
        },
        {
            title: t`Debt`,
            variant: 'warning',
            icon: 'CreditCard',
            description: t`Loans & credit cards`
        }
    ] as const;

    return (
        <BottomSheet ref={ref}>
            <View className="gap-y-1 mb-10">
                <Text className="text-center text-[20px] text-primary font-semibold">{t`New Transaction`}</Text>
                <Text className="text-center text-[14px] text-secondary-foreground">{t`Choose a type to get started`}</Text>
            </View>

            <View className="gap-y-3.5">
                {accountTypes.map(({ title, description, icon, variant }) => (
                    <CreateAccountCard description={description} icon={icon} key={title} title={title} variant={variant} />
                ))}
            </View>
        </BottomSheet>
    );
};
