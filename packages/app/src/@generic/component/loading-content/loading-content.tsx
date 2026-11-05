import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly children: ReactNode;
    readonly isLoading: boolean;
    readonly className?: string;
    readonly containerClassName?: string;
    readonly loadingIndicator?: ReactNode;
}

export const LoadingContent = ({
    children,
    isLoading,
    className,
    containerClassName,
    loadingIndicator = <ActivityIndicator size="small" style={StyleSheet.absoluteFill} />
}: Props) => {
    const contentPointerEvents = isLoading ? 'none' : 'auto';
    const contentImportantForAccessibility = isLoading ? 'no-hide-descendants' : 'auto';
    const accessibilityState = { busy: isLoading };

    return (
        <View accessibilityState={accessibilityState} className={containerClassName}>
            <View
                pointerEvents={contentPointerEvents}
                accessibilityElementsHidden={isLoading}
                importantForAccessibility={contentImportantForAccessibility}
                className={cn(className, isLoading && 'opacity-0')}
            >
                {children}
            </View>
            {isLoading ? loadingIndicator : null}
        </View>
    );
};
