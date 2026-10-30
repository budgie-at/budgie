import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isSelected: boolean;
}

export const CategorizeInboxSelectionIndicator = ({ isSelected }: Props) => {
    if (isSelected) {
        return (
            <View className="size-[24px] items-center justify-center rounded-full bg-positive-action">
                <Icon icon={UserIconNameEnum.Check} size={15} className="text-positive-action-foreground" />
            </View>
        );
    }

    return <View className="size-[24px] rounded-full border-2 border-secondary-foreground/50" />;
};
