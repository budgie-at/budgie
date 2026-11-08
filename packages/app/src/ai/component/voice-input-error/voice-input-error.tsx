import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';
import { MOTION_FADE_IN, MOTION_FADE_OUT } from '../../../@generic/constant/motion.constant';
import { VoiceInputOverlaySelector } from '../voice-input-overlay/voice-input-overlay.selector';

interface Props {
    readonly message: string;
    readonly onDismiss: () => void;
}

export const VoiceInputError = ({ message, onDismiss }: Props) => (
    <Animated.View className="absolute inset-x-4 top-1/4" entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT}>
        <View className="bg-primary-reverse border border-secondary-corner rounded-4xl p-6 shadow-lg">
            <View className="items-center mb-4">
                <View className="bg-destructive-background rounded-full p-3 mb-3">
                    <Icon icon={UserIconNameEnum.CircleAlert} size={32} className="text-destructive-foreground" />
                </View>
                <Text className="text-primary text-lg font-semibold text-center mb-2">
                    <Trans>Something went wrong</Trans>
                </Text>
                <Text className="text-secondary-foreground text-base text-center">{message}</Text>
            </View>
            <Button variant="primary" onPress={onDismiss} content={t`Try Again`} testID={VoiceInputOverlaySelector.ErrorRetryButton} />
        </View>
    </Animated.View>
);
