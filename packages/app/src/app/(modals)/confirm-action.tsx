import { useLingui } from '@lingui/react/macro';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../@generic/component/button/button';
import { CircleIcon } from '../../@generic/component/circle-icon/circle-icon';
import { CONFIRM_ACTION_CARD_VARIANTS } from '../../@generic/constant/confirm-action-card-variants.constant';
import { useConfirmActionModal } from '../../@generic/context/confirm-action-modal.context';

export default function ConfirmActionModal() {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { currentParams, resolveConfirmAction } = useConfirmActionModal();

    const handleConfirm = () => void resolveConfirmAction(true);
    const handleCancel = () => void resolveConfirmAction(false);

    if (!currentParams) {
        return null;
    }

    const { variant, icon, title, description, buttonText, buttonIcon } = currentParams;
    const containerStyle = { paddingBottom: bottom + 16 };

    return (
        <Animated.View entering={FadeIn} className="flex-1 justify-end bg-black/60">
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
            <Animated.View entering={SlideInDown} className={CONFIRM_ACTION_CARD_VARIANTS({ variant })} style={containerStyle}>
                <View className="mx-5 bg-primary-reverse pt-xl pb-5xl">
                    <CircleIcon icon={icon} variant={variant} size={50} iconSize={24} className="mb-4xl self-center rounded-3xl" />
                    <Text className="text-primary text-xl font-semibold text-center mb-sm">{title}</Text>
                    {description ? <Text className="text-secondary-foreground text-center text-sm mb-3xl">{description}</Text> : null}
                    <View className="gap-y-md">
                        <Button leftIcon={buttonIcon} content={buttonText} onPress={handleConfirm} variant={variant} />
                        <Button onPress={handleCancel} content={t`Cancel`} variant="ghost" />
                    </View>
                </View>
            </Animated.View>
        </Animated.View>
    );
}
