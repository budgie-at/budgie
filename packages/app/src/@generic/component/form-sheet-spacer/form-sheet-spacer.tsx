import { View } from 'react-native';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

const SPACER_HEIGHT = 1000;

export const FormSheetSpacer = () => {
    const { backgroundColor } = useFormsheetListStyles();
    const spacerStyle = { height: SPACER_HEIGHT, backgroundColor };

    return <View style={spacerStyle} />;
};
