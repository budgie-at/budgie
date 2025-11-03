import { useLingui } from '@lingui/react/macro';
import { Mic } from 'lucide-react-native';
import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ThemeContext } from '../../../theme/context/theme.context';

export const AiChatButton = () => {
    const { t } = useLingui();
    const { toggleColorSchema } = useContext(ThemeContext);

    return (
        <View>
            <Pressable className="bg-primary p-7xl rounded-full mb-sm -translate-y-4" onPress={toggleColorSchema}>
                <Icon className="text-primary-reverse" icon={Mic} size={16} />
            </Pressable>

            <Text className="text-primary text-center">{t`AI`}</Text>
        </View>
    );
};
