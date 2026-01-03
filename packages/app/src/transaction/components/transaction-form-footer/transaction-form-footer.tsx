import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn, emptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { Footer } from '../../../@generic/component/footer/footer';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
}

export const TransactionFormFooter = ({ variant, buttonText, onSubmit, onDelete }: Props) => {
    const { t } = useLingui();
    const { ref, handleConfirm, handleOpen } = useConfirmAction(onDelete ?? emptyFn);

    return (
        <>
            <KeyboardStickyView>
                <Footer>
                    <View className="flex-row gap-2">
                        {isDefined(onDelete) ? (
                            <Button leftIcon={UserIconNameEnum.Trash2} onPress={handleOpen} variant="destructive" />
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
                buttonText={t`Delete transaction`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.Info}
                title={t`Are you sure you want to delete this transaction?`}
            />
        </>
    );
};
