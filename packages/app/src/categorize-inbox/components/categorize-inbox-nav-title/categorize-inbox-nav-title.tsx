import { Text } from 'react-native';

interface Props {
    readonly children: string;
}

export const CategorizeInboxNavTitle = ({ children }: Props) => (
    <Text className="text-primary text-[17px] leading-[22px] font-semibold text-center" numberOfLines={1} accessibilityRole="header">
        {children}
    </Text>
);
