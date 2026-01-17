import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ReactNode, RefObject } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn } from '@rnw-community/shared';

import { DETACHED_BOTTOM_SHEET_BORDER_PALETTE } from '../../constant/detached-bottom-sheet-border-palette.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly variant: ColorPaletteVariant;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
    readonly buttonText: string;
    readonly buttonIcon?: UserIconNameEnum;
    readonly isDisabled?: boolean;
    readonly isLoading?: boolean;
    readonly onSubmit: EmptyFn;
    readonly children?: ReactNode;
}

const cardVariants = cva('mx-5xl rounded-5xl overflow-hidden border-2 shadow-[0px_0px_15px_-8px]', {
    variants: { variant: DETACHED_BOTTOM_SHEET_BORDER_PALETTE }
});

export const ConfirmActionBottomSheet = (props: Props) => {
    const { ref, variant, icon, title, description, buttonText, buttonIcon, isDisabled, isLoading, onSubmit, children } = props;

    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();

    const handleCancel = () => void ref.current?.close();

    const isButtonDisabled = isDisabled || isLoading;
    const submitButtonContent = isLoading ? <ActivityIndicator size="small" /> : buttonText;

    return (
        <BottomSheet className={cardVariants({ variant })} ref={ref} enableDynamicSizing bottomInset={bottom} isCloseable={false} detached>
            <BottomSheetView className="mx-5 bg-transparent pt-xl pb-5xl">
                <CircleIcon icon={icon} variant={variant} size={50} iconSize={24} className="mb-4xl self-center rounded-3xl" />
                <Text className="text-primary text-xl font-semibold text-center mb-sm">{title}</Text>
                <Text className="text-secondary-foreground text-center text-sm mb-3xl">{description}</Text>
                {children ? <View className="mb-3xl">{children}</View> : null}
                <View className="gap-y-md">
                    <Button
                        leftIcon={buttonIcon}
                        content={submitButtonContent}
                        disabled={isButtonDisabled}
                        onPress={onSubmit}
                        variant={variant}
                    />
                    <Button onPress={handleCancel} content={t`Cancel`} variant="ghost" disabled={isLoading} />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
