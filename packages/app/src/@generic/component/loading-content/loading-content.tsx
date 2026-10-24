import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly children: ReactNode;
    readonly isLoading: boolean;
    readonly className?: string;
}

export const LoadingContent = ({ children, isLoading, className }: Props) => {
    const contentPointerEvents = isLoading ? 'none' : 'auto';

    return (
        <View className="min-h-[20px] min-w-[20px] items-center justify-center">
            <View pointerEvents={contentPointerEvents} className={cn('items-center justify-center', className, isLoading && 'opacity-0')}>
                {children}
            </View>
            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    style={StyleSheet.absoluteFill}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                />
            ) : null}
        </View>
    );
};
