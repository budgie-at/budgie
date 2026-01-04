import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const MccCategoryChip = ({ mccCategory }: Props) => (
    <View className="flex-row items-center gap-x-xs rounded-sm py-xxs px-sm bg-primary/5 border border-primary/10">
        <Icon icon={UserIconNameEnum.Building2} size={10} className="text-primary/50" />
        <Text className="text-primary/60 text-xxs font-medium">{mccCategory.shortDescription}</Text>
    </View>
);
