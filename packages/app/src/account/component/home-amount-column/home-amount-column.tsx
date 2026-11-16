import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const columnVariants = cva('gap-y-xxs', {
    variants: { isStacked: { true: 'items-start', false: 'max-w-[42%] shrink-0 items-end' } }
});

export const HomeAmountColumn = ({ children }: Props) => (
    <View className={columnVariants({ isStacked: useIsAccessibilityTextSize() })}>{children}</View>
);
