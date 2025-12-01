import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';

export const AiChatButton = () => {
    const navigateToAiPage = () => void router.push('/ai');

    return (
        <View>
            <Pressable className="bg-primary p-7xl rounded-full mb-sm -translate-y-[30px]" onPress={navigateToAiPage}>
                <Icon className="text-primary-reverse" icon={Mic} size={16} />
            </Pressable>

            <Text className="text-secondary-foreground text-center -translate-y-6 text-xxs">
                <Trans>AI</Trans>
            </Text>
        </View>
    );
};
