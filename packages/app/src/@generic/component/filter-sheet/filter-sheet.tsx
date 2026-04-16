import { ReactNode } from 'react';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly children: ReactNode;
}

export const FilterSheet = ({ children }: Props) => {
    const { backgroundColor } = useFormsheetListStyles();
    const containerStyle = { flex: 1, backgroundColor };

    return <View style={containerStyle}>{children}</View>;
};
