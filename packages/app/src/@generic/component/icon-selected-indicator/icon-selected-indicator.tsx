import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../icon/icon';

export const IconSelectedIndicator = () => (
    <View pointerEvents="none" className="absolute inset-0 rounded-3xl border-2 border-positive-action">
        <View className="absolute right-[3px] top-[3px] h-[18px] w-[18px] items-center justify-center rounded-full bg-positive-action">
            <Icon icon={UserIconNameEnum.Check} size={12} className="text-positive-action-foreground" />
        </View>
    </View>
);
