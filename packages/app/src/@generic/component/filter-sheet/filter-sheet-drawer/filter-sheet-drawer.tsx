import { ReactNode } from 'react';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly children: ReactNode;
}

const DRAWER_Z_INDEX = 10;

export const FilterSheetDrawer = ({ children }: Props) => {
    const { backgroundColor } = useFormsheetListStyles();
    const style = {
        backgroundColor,
        zIndex: DRAWER_Z_INDEX
    };

    return (
        <View className="gap-y-md border-t border-t-secondary-corner px-xl pt-lg pb-safe-or-[16px]" style={style}>
            {children}
        </View>
    );
};
