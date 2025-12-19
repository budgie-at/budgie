import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';

export const AiChatButton = () => (
    <View>
        <Link href="/ai" asChild>
            <Pressable className="bg-primary p-7xl rounded-full mb-sm -translate-y-[30px]">
                <Icon className="text-primary-reverse" icon={Mic} size={16} />
            </Pressable>
        </Link>

        <Text className="text-secondary-foreground text-center -translate-y-6 text-xxs">
            <Trans>AI</Trans>
        </Text>
    </View>
);
