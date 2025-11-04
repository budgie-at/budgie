import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

export default function Ai() {
    const { t } = useLingui();

    return (
        <View>
            <Text>{t`Ai Page`}</Text>
        </View>
    );
}
