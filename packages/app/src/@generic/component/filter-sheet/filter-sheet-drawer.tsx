import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly children: ReactNode;
}

export const FilterSheetDrawer = ({ children }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { backgroundColor } = useFormsheetListStyles();
    const style = { backgroundColor, paddingBottom: bottom };

    return (
        <View className="gap-y-md border-t border-t-secondary-corner px-xl pt-md" style={style}>
            {children}
        </View>
    );
};
