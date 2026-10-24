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
        <View>
            <View pointerEvents={contentPointerEvents} className={cn(className, isLoading && 'opacity-0')}>
                {children}
            </View>
            {isLoading ? <ActivityIndicator size="small" style={StyleSheet.absoluteFill} /> : null}
        </View>
    );
};
