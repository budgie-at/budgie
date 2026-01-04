import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn, emptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { Footer } from '../../../@generic/component/footer/footer';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { SuggestRuleSection } from '../../../rule/components/suggest-rule-section/suggest-rule-section';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
    readonly showSuggestRule?: boolean;
    readonly onSuggestRulePress?: EmptyFn;
    readonly showConvertButton?: boolean;
    readonly onConvert?: EmptyFn;
}

export const TransactionFormFooter = (props: Props) => {
    const { variant, buttonText, onSubmit, onDelete, showConvertButton, onConvert, showSuggestRule, onSuggestRulePress } = props;
    const { t } = useLingui();
    const { ref, isLoading, handleConfirm, handleOpen } = useConfirmAction(onDelete ?? emptyFn);

    return (
        <>
            <KeyboardStickyView>
                <Footer>
                    {showSuggestRule && isDefined(onSuggestRulePress) ? <SuggestRuleSection onPress={onSuggestRulePress} /> : null}

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
                isLoading={isLoading}
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
