import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly message: string;
    readonly onDismiss: () => void;
}

const FADE_DURATION = 200;

export const VoiceInputError = ({ message, onDismiss }: Props) => {
    const tryAgainContent = <Trans>Try Again</Trans>;

    return (
        <Animated.View
            className="absolute inset-x-4 top-1/4"
            entering={FadeIn.duration(FADE_DURATION)}
            exiting={FadeOut.duration(FADE_DURATION)}
        >
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
                <Button variant="primary" onPress={onDismiss} content={tryAgainContent} />
            </View>
        </Animated.View>
    );
};
