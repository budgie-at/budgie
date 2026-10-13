import { AccountDebtTypeEnum, AccountEntityInterface } from '@budgie/contracts';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';
import { DebtProgressRing } from '../debt-progress-ring/debt-progress-ring';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title'> {
    readonly accessibilityLabel: string;
    readonly debtType: AccountDebtTypeEnum;
    readonly percentage: number;
    readonly subtitle: ReactNode;
    readonly trailing: ReactNode;
}

export const DebtAccountCardFrame = ({ id, title, accessibilityLabel, debtType, percentage, subtitle, trailing }: Props) => {
    const handleOpenDetails = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });

    return (
        <Card
            accessible
            accessibilityRole="button"
            testID={AccountCardBaseSelector.Card(title)}
            accessibilityLabel={accessibilityLabel}
            onPress={handleOpenDetails}
            className="mb-3 px-xl py-lg"
        >
            <View className="flex-row items-center gap-x-lg">
                <DebtProgressRing debtType={debtType} percentage={percentage}>
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-ghost-background">
                        <Text className="text-base font-semibold text-primary">{title.trim().charAt(0).toLocaleUpperCase()}</Text>
                    </View>
                </DebtProgressRing>
                <View className="min-w-0 flex-1 items-start gap-y-xxs">
                    <Text className="text-base font-semibold text-primary" ellipsizeMode="tail" numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle}
                </View>
                {trailing}
            </View>
        </Card>
    );
};
