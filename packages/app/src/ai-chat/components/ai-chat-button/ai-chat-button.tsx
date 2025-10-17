import { useLingui } from '@lingui/react/macro';
import { Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';

export const AiChatButton = () => {
    const { t } = useLingui();

    return (
        <View>
            <Pressable className="bg-bg-primary-reverse p-[24] rounded-full mb-[6] -translate-y-[15]">
                <Icon className="text-text-primary-reverse" icon={Mic} size={16} />
            </Pressable>

            <Text className="text-text-primary text-center">{t`AI`}</Text>
        </View>
    );
};
