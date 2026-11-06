import { useWindowDimensions, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { isCompactTransactionForm } from '../../utils/is-compact-transaction-form.util';

import type { PropsWithChildren } from 'react';

export const QuickFormContext = ({ children }: PropsWithChildren) => {
    const { fontScale, height } = useWindowDimensions();
    const heightClassName = isCompactTransactionForm(fontScale, height) ? 'h-[76px]' : 'h-[108px]';

    return <View className={cn('overflow-hidden justify-center', heightClassName)}>{children}</View>;
};
