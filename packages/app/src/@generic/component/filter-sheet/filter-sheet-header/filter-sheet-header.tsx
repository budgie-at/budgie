import { Text, View } from 'react-native';

import { useFormsheetListStyles } from '../../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly title: string;
}

const HEADER_Z_INDEX = 10;

export const FilterSheetHeader = ({ title }: Props) => {
    const { backgroundColor } = useFormsheetListStyles();
    const style = { backgroundColor, zIndex: HEADER_Z_INDEX };

    return (
        <View className="border-b border-b-secondary-corner px-xl py-lg" style={style}>
            <Text className="text-xl font-bold tracking-tight text-primary">{title}</Text>
        </View>
    );
};
