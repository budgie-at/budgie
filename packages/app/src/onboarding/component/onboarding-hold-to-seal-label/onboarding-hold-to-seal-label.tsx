import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly isLoading: boolean;
    readonly colorClassName: string;
}

export const OnboardingHoldToSealLabel = ({ label, isLoading, colorClassName }: Props) => (
    <LoadingContent isLoading={isLoading}>
        <View className="flex-row items-center justify-center gap-x-md">
            <Icon icon={UserIconNameEnum.Lock} size={18} className={colorClassName} />
            <Text className={cn('text-[17px] font-semibold', colorClassName)}>{label}</Text>
        </View>
    </LoadingContent>
);
