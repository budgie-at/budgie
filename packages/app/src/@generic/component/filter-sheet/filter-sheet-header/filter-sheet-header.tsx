import { View } from 'react-native';

import { SheetTitleRow } from '../../sheet-title-row/sheet-title-row';

interface Props {
    readonly title: string;
}

export const FilterSheetHeader = ({ title }: Props) => (
    <View className="px-xl">
        <SheetTitleRow title={title} trailing={<View />} />
    </View>
);
