import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';

export const AiChatButton = () => {
    const navigateToAiPage = () => {
        void router.push('/ai');
    };

    return (
        <View>
            <Pressable className="bg-primary p-7xl rounded-full mb-sm -translate-y-4 shadow-primary shadow-2xl" onPress={navigateToAiPage}>
                <Icon className="text-primary-reverse" icon={Mic} size={16} />
            </Pressable>

            <Text className="text-primary text-center">
                <Trans>AI</Trans>
            </Text>
        </View>
    );
};
