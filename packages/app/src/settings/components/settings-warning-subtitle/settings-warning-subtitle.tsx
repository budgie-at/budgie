import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { GROUPED_LIST_SUBTITLE_CLASSNAME } from '../../../@generic/constant/grouped-list-subtitle-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly children: string;
}

export const SettingsWarningSubtitle = ({ children }: Props) => (
    <View className="flex-row items-start gap-x-xs">
        <View className="h-[18px] justify-center">
            <Icon icon={UserIconNameEnum.TriangleAlert} size={13} className="text-warning-strong" />
        </View>
        <Text className={cn('shrink text-warning-strong', GROUPED_LIST_SUBTITLE_CLASSNAME)} numberOfLines={3}>
            {children}
        </Text>
    </View>
);
