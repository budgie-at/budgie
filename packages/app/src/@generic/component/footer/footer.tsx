import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    readonly children: ReactNode;
}

export const Footer = ({ children }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const style = { paddingBottom: bottom };

    return (
        <View className="gap-md pt-xl px-7xl border-t border-t-secondary-corner bg-primary-reverse" style={style}>
            {children}
        </View>
    );
};
