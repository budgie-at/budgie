import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn, emptyFn, isDefined } from '@rnw-community/shared';

import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { Button } from '../button/button';
import { ConfirmActionBottomSheet } from '../confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { Footer } from '../footer/footer';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
    readonly onConvert?: EmptyFn;
    readonly deleteConfirmTitle: string;
    readonly showConvertButton?: boolean;
    readonly deleteConfirmButtonText: string;
    readonly children?: ReactNode;
}

export const FormFooter = (props: Props) => {
    const { variant, buttonText, onSubmit, onDelete, onConvert, showConvertButton, deleteConfirmTitle, deleteConfirmButtonText, children } =
        props;

    const { t } = useLingui();
    const { ref, handleConfirm, handleOpen, isLoading } = useConfirmAction(onDelete ?? emptyFn);

    return (
        <>
            <KeyboardStickyView>
                <Footer>
                    {children}

                    <View className="flex-row gap-2">
                        {isDefined(onDelete) ? (
                            <Button leftIcon={UserIconNameEnum.Trash2} onPress={handleOpen} variant="destructive" />
                        ) : null}
                        {showConvertButton && isDefined(onConvert) ? (
                            <Button leftIcon={UserIconNameEnum.ArrowRightLeft} onPress={onConvert} variant="default" />
                        ) : null}
                        <Button
                            leftIcon={UserIconNameEnum.CircleCheck}
                            onPress={onSubmit}
                            variant={variant}
                            className="flex-1"
                            content={buttonText}
                        />
                    </View>
                </Footer>
            </KeyboardStickyView>

            <ConfirmActionBottomSheet
                ref={ref}
                variant="destructive"
                description={t`This action cannot be undone.`}
                buttonText={deleteConfirmButtonText}
                onSubmit={handleConfirm}
                isLoading={isLoading}
                icon={UserIconNameEnum.Info}
                title={deleteConfirmTitle}
            />
        </>
    );
};
