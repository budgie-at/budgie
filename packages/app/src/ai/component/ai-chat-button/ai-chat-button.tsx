import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Mic } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useLlmContext } from '../../context/llm.context';

export const AiChatButton = () => {
    const { llm } = useLlmContext();

    return (
        <View>
            {llm.isReady ? (
                <Link href="/ai" asChild>
                    <Pressable className="bg-primary p-7xl rounded-full mb-sm -translate-y-[30px]">
                        <Icon className="text-primary-reverse" icon={Mic} size={16} />
                    </Pressable>
                </Link>
            ) : (
                <View className="bg-primary p-7xl rounded-full mb-sm -translate-y-[30px] items-center">
                    <ActivityIndicator size="small" className="color-gray-700 w-[16px] h-[16px]" />
                </View>
            )}

            <Text className="text-secondary-foreground text-center -translate-y-6 text-xxs">
                <Trans>AI</Trans>
            </Text>
        </View>
    );
};
