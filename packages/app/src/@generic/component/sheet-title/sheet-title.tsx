import { Text } from 'react-native';

interface Props {
    readonly title: string;
}

export const SheetTitle = ({ title }: Props) => (
    <Text accessibilityRole="header" className="text-primary px-xl pt-xl pb-lg text-center text-[17px] leading-[22px] font-semibold">
        {title}
    </Text>
);
