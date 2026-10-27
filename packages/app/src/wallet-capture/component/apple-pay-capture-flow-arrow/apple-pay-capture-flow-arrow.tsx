import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

export const ApplePayCaptureFlowArrow = () => (
    <View className="h-[40px] justify-center">
        <Icon icon={UserIconNameEnum.ArrowRight} size={16} className="text-secondary-foreground" />
    </View>
);
