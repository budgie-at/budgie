import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../@generic/component/button/button';
import { CircleIcon } from '../../@generic/component/circle-icon/circle-icon';
import { useConfirmActionModal } from '../../@generic/context/confirm-action-modal.context';
import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

const cardVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'mx-5xl rounded-5xl overflow-hidden border-2 shadow-[0px_0px_15px_-8px]',
    {
        variants: {
            variant: {
                'dark-warning': 'border-dark-warning-corner shadow-dark-warning-corner/75',
                destructive: 'border-destructive-corner shadow-destructive-corner/75',
                secondary: 'border-secondary-corner shadow-secondary-corner/75',
                positive: 'border-positive-corner shadow-positive-corner/75',
                warning: 'border-warning-corner shadow-warning-corner/75',
                default: 'border-default-corner shadow-default-corner/75',
                primary: 'border-ghost-corner shadow-ghost-corner/75',
                ghost: 'border-ghost-corner shadow-ghost-corner/75',
                pink: 'border-pink-corner shadow-pink-corner/75'
            }
        }
    }
);

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
        <View className="flex-1">
            <Pressable className="flex-1 bg-black/60" onPress={handleCancel} />
            <View className={cardVariants({ variant })} style={containerStyle}>
                <View className="mx-5 bg-primary-reverse pt-xl pb-5xl">
                    <CircleIcon icon={icon} variant={variant} size={50} iconSize={24} className="mb-4xl self-center rounded-3xl" />
                    <Text className="text-primary text-xl font-semibold text-center mb-sm">{title}</Text>
                    {description ? <Text className="text-secondary-foreground text-center text-sm mb-3xl">{description}</Text> : null}
                    <View className="gap-y-md">
                        <Button leftIcon={buttonIcon} content={buttonText} onPress={handleConfirm} variant={variant} />
                        <Button onPress={handleCancel} content={t`Cancel`} variant="ghost" />
                    </View>
                </View>
            </View>
        </View>
    );
}
