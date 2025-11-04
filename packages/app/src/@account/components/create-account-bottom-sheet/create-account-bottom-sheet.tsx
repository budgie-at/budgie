import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Ref } from 'react';
import { ArrowRightLeft } from 'lucide-react-native';

interface CreateAccountBottomSheetPropsInterface {
    readonly ref: Ref<BottomSheetModal>;
}

export const CreateAccountBottomSheet = ({ ref }: CreateAccountBottomSheetPropsInterface) => {
    const { t } = useLingui();

    const accountTypes = [
        {
            title: t`Expense`,
            variant: 'destructive',
            icon: ICONS.TrendingDown,
            description: t`Money you spend`
        },
        {
            title: t`Income`,
            variant: 'positive',
            icon: ICONS.TrendingUp,
            description: t`Money you earn`
        },
        {
            title: t`Transfer`,
            variant: 'default',
            icon: ICONS.ArrowRightLeft,
            description: t`Move between accounts`
        },
        {
            title: t`Debt`,
            variant: 'warning',
            icon: ICONS.CreditCard,
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
                {accountTypes.map(account => (
                    <Card className="p-5xl items-center gap-x-4 flex-row gap-1" key={account.title}>
                        <CircleIcon
                            border={false}
                            className="rounded-5xl w-12 h-12"
                            icon={account.icon}
                            size="xl"
                            variant={account.variant}
                        />

                        <View className="mr-auto">
                            <Text className="text-primary text-[16px] font-medium">{account.title}</Text>
                            <Text className="text-secondary-foreground text-[14px]">{account.description}</Text>
                        </View>

                        <Icon className="text-primary/40" icon={ICONS.ChevronRight} />
                    </Card>
                ))}
            </View>
        </BottomSheet>
    );
};
