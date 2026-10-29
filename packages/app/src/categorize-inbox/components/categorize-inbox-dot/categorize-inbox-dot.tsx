import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly className: string;
}

export const CategorizeInboxDot = ({ className }: Props) => <View className={cn('h-[8px] w-[8px] rounded-full', className)} />;
