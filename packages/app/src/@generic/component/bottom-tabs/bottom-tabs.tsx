import { View, ViewProps } from 'react-native';

export const BottomTabs = ({ children, ...props }: ViewProps) => (
    <View {...props} className="bg-primary-reverse border-t border-t-secondary-corner px-5xl pt-4xl">
        {children}
    </View>
);
