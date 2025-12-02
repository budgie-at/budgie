import { Text } from 'react-native';

interface Props {
    readonly title: string;
}

export const TransactionFilterSectionHeader = ({ title }: Props) => (
    <Text className="text-secondary-foreground uppercase mb-xl text-sm font-medium">{title}</Text>
);
