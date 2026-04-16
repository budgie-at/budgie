import { ReactNode } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFormsheetListStyles } from '../../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useFilterSheetContext } from '../filter-sheet/filter-sheet';

interface Props {
    readonly children: ReactNode;
}

const DRAWER_Z_INDEX = 10;
const MIN_BOTTOM_SPACING = 16;

export const FilterSheetDrawer = ({ children }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { backgroundColor } = useFormsheetListStyles();
    const { setDrawerHeight } = useFilterSheetContext();
    const style = {
        backgroundColor,
        paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING),
        zIndex: DRAWER_Z_INDEX
    };

    const handleLayout = (event: LayoutChangeEvent) => {
        setDrawerHeight(event.nativeEvent.layout.height);
    };

    return (
        <View
            className="absolute bottom-0 left-0 right-0 gap-y-md border-t border-t-secondary-corner px-xl pt-lg"
            style={style}
            onLayout={handleLayout}
        >
            {children}
        </View>
    );
};
