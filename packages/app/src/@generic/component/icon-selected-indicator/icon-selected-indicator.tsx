import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../icon/icon';

export const IconSelectedIndicator = () => (
    <View pointerEvents="none" className="absolute inset-0 rounded-3xl border-2 border-positive-action">
        <View className="absolute -right-[4px] -top-[4px] h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-surface bg-positive-action">
            <Icon icon={UserIconNameEnum.Check} size={12} className="text-positive-action-foreground" />
        </View>
    </View>
);
