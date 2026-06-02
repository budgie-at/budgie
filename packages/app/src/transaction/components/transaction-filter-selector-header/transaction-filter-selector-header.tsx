import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PageHeader } from '../../../@generic/component/page-header/page-header';

interface Props {
    readonly title: string;
    readonly onClose: EmptyFn;
}

const TOP_SPACE = 24;

export const TransactionFilterSelectorHeader = ({ title, onClose }: Props) => {
    const containerStyle = { paddingTop: TOP_SPACE };
    const right = (
        <HapticPressable className="h-[44px] w-[44px] items-center justify-center rounded-full bg-primary/10" onPress={onClose}>
            <Icon icon={UserIconNameEnum.X} size={18} className="text-primary" />
        </HapticPressable>
    );

    return (
        <View className="absolute top-0 right-0 left-0 z-10 bg-primary-reverse" style={containerStyle}>
            <PageHeader className="border-b-0" size="md" title={title} right={right} />
        </View>
    );
};
