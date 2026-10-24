import { ReactNode } from 'react';
import { View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

interface Props {
    readonly children: ReactNode;
}

export const AppLockOverlay = ({ children }: Props) => (
    <FullWindowOverlay>
        <View className="flex-1 bg-primary-reverse">{children}</View>
    </FullWindowOverlay>
);
