import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly children: ReactNode;
    readonly isLoading: boolean;
    readonly className?: string;
}

const styles = StyleSheet.create({
    smallIndicatorFootprint: { minWidth: 20, minHeight: 20 }
});

export const LoadingContent = ({ children, isLoading, className }: Props) => {
    const contentPointerEvents = isLoading ? 'none' : 'auto';

    return (
        <View className="relative items-center justify-center" style={styles.smallIndicatorFootprint}>
            <View pointerEvents={contentPointerEvents} className={cn('items-center justify-center', className, isLoading && 'opacity-0')}>
                {children}
            </View>
            {isLoading ? (
                <View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={StyleSheet.absoluteFill}
                    className="items-center justify-center"
                >
                    <ActivityIndicator size="small" />
                </View>
            ) : null}
        </View>
    );
};
