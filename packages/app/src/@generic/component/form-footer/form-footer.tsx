import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { useConfirmActionModal } from '../../context/confirm-action-modal.context';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { Button } from '../button/button';
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
    readonly submitTestID?: string;
    readonly deleteTestID?: string;
}

export const FormFooter = (props: Props) => {
    const {
        variant,
        buttonText,
        onSubmit,
        onDelete,
        onConvert,
        showConvertButton,
        deleteConfirmTitle,
        deleteConfirmButtonText,
        children,
        submitTestID,
        deleteTestID
    } = props;

    const { t } = useLingui();
    const { openConfirmAction } = useConfirmActionModal();

    const handleDelete = async () => {
        const confirmed = await openConfirmAction({
            variant: 'destructive',
            description: t`This action cannot be undone.`,
            buttonText: deleteConfirmButtonText,
            icon: UserIconNameEnum.Info,
            title: deleteConfirmTitle
        });

        if (confirmed) {
            onDelete?.();
        }
    };

    return (
        <KeyboardStickyView>
            <Footer>
                {children}

                <View className="flex-row gap-2">
                    {isDefined(onDelete) ? (
                        <Button testID={deleteTestID} leftIcon={UserIconNameEnum.Trash2} onPress={handleDelete} variant="destructive" />
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
                        testID={submitTestID}
                    />
                </View>
            </Footer>
        </KeyboardStickyView>
    );
};
