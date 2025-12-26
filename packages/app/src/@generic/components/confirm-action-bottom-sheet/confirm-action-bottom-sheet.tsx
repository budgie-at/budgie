import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { RefObject } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn } from '@rnw-community/shared';

import { IconName, ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly variant: ColorPaletteVariant;
    readonly isDisabled?: boolean;
    readonly description: string;
    readonly isLoading?: boolean;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly icon: IconName;
    readonly title: string;
}

const cardVariants = cva('mx-5xl rounded-5xl overflow-hidden border-2 shadow-[0px_0px_15px_-8px]', {
    variants: {
        variant: {
            'dark-warning': 'border-dark-warning-corner shadow-dark-warning-corner/75',
            destructive: 'border-destructive-corner shadow-destructive-corner/75',
            secondary: 'border-secondary-corner shadow-secondary-corner/75',
            positive: 'border-positive-corner shadow-positive-corner/75',
            warning: 'border-warning-corner shadow-warning-corner/75',
            default: 'border-default-corner shadow-default-corner/75',
            ghost: 'border-ghost-corner shadow-ghost-corner/75',
            pink: 'border-pink-corner shadow-pink-corner/75'
        }
    }
});

export const ConfirmActionBottomSheet = (props: Props) => {
    const { ref, icon, isLoading, isDisabled, onSubmit, variant, title, buttonText, description } = props;
    const { bottom } = useSafeAreaInsets();
    const { t } = useLingui();

    const handleCancel = () => void ref.current?.close();
    const buttonDisabled = isLoading || isDisabled;

    const submitButtonContent = isLoading ? <ActivityIndicator size="small" /> : buttonText;

    return (
        <BottomSheet
            className={cardVariants({ variant })}
            ref={ref}
            enableDynamicSizing
            bottomInset={bottom}
            enablePanDownToClose
            detached={true}
        >
            <BottomSheetView className="mx-5 bg-transparent pt-xl pb-5xl">
                <CircleIcon icon={ICONS[icon]} variant={variant} size="2xl" className="mb-8xl self-center rounded-3xl" />

                <Text className="text-primary text-xl font-semibold text-center mb-sm">{title}</Text>

                <Text className="text-secondary-foreground text-center text-sm mb-3xl">{description}</Text>

                <View className="gap-y-md">
                    <Button
                        content={submitButtonContent}
                        disabled={buttonDisabled}
                        onPress={onSubmit}
                        variant={variant}
                        size="md"
                    />
                    <Button onPress={handleCancel} content={t`Cancel`} variant="ghost" />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
