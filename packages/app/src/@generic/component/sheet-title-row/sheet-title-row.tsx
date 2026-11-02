import { Text, View } from 'react-native';

import { SheetCloseButton } from '../sheet-close-button/sheet-close-button';

interface Props {
    readonly title: string;
}

export const SheetTitleRow = ({ title }: Props) => (
    <View className="flex-row items-center">
        <SheetCloseButton />
        <Text className="text-primary flex-1 text-center text-[17px] font-semibold leading-[22px]" accessibilityRole="header">
            {title}
        </Text>
        <View className="w-[36px]" />
    </View>
);
