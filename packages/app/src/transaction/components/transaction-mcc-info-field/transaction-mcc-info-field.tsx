import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const TransactionMccInfoField = ({ mccCategory }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-xs">
            <Text className="text-xs font-medium text-secondary-foreground">{t`Merchant Category`}</Text>
            <View className="flex-row items-center gap-x-sm rounded-xl bg-secondary-background px-xl py-lg border border-secondary-corner">
                <View className="rounded-full p-sm bg-primary/5">
                    <Icon icon={UserIconNameEnum.Building2} size={16} className="text-primary/70" />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-primary">{mccCategory.shortDescription}</Text>
                    <Text className="text-xs text-secondary-foreground mt-xxs">
                        {t`MCC`} {mccCategory.mcc}
                    </Text>
                </View>
            </View>
        </View>
    );
};
