import { Text } from 'react-native';

interface Props {
    readonly children: string | number;
}

export const InzhurImportSummaryValue = ({ children }: Props) => (
    <Text className="text-primary text-[17px] font-semibold tabular-nums">{children}</Text>
);
