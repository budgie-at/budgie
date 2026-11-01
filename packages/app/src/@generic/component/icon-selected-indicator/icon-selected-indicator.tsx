import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../icon/icon';

export const IconSelectedIndicator = () => (
    <View pointerEvents="none" className="absolute inset-0 rounded-3xl border-2 border-primary">
        <View className="absolute right-[4px] top-[4px] h-[18px] w-[18px] items-center justify-center rounded-full bg-primary">
            <Icon icon={UserIconNameEnum.Check} size={12} className="text-primary-reverse" />
        </View>
    </View>
);
