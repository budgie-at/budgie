import { useColorScheme, View } from 'react-native';
import { useVibration } from '../../hooks/use-vibration.hook';

export const TabButton = ({ children, focused }: { readonly focused: boolean; readonly children: React.ReactNode }) => {
    const scheme = useColorScheme();

    const activeBg = scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(10,10,10,0.05)';

    return (
        <View
            style={{
                padding: 12,
                borderRadius: 20,
                backgroundColor: focused ? activeBg : 'transparent'
            }}
        >
            {children}
        </View>
    );
};
