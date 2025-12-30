import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useLlmContext } from '../../context/llm.context';

export const AiChatButton = () => {
    const { llm } = useLlmContext();

    return (
        <View>
            {llm.isReady ? (
                <Link href="/ai" asChild>
                    <HapticPressable className="bg-primary p-7xl rounded-full mb-sm -translate-y-10 w-19 h-19 items-center justify-center">
                        <Icon className="text-primary-reverse" icon="Mic" size={16} />
                    </HapticPressable>
                </Link>
            ) : (
                <View className="bg-primary p-7xl rounded-full mb-sm -translate-y-10 w-19 h-19 items-center justify-center">
                    <ActivityIndicator size="small" className="text-primary-reverse" />
                </View>
            )}

            <Text className="text-secondary-foreground text-center -translate-y-10 text-xxs">
                <Trans>AI</Trans>
            </Text>
        </View>
    );
};
