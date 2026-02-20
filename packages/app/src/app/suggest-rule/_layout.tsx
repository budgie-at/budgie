import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

const screenOptions = { headerShown: false };

export default function SuggestRuleLayout() {
    const { backgroundColor } = useFormsheetListStyles();

    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View style={containerStyle}>
            <Stack screenOptions={screenOptions} />
        </View>
    );
}
