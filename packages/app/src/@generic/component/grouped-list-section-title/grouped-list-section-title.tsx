import { Text } from 'react-native';

interface Props {
    readonly title: string;
}

export const GroupedListSectionTitle = ({ title }: Props) => (
    <Text className="text-secondary-foreground px-3xl pb-md text-[15px] font-semibold" accessibilityRole="header">
        {title}
    </Text>
);
