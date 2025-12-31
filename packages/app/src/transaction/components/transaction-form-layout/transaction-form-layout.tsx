import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn, emptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { Footer } from '../../../@generic/component/footer/footer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly children: ReactNode;
    readonly onDelete?: EmptyFn;
}

export const TransactionFormLayout = ({ title, description, icon, onDelete, variant, buttonText, onSubmit, children }: Props) => {
    const { t } = useLingui();
    const { ref, handleConfirm, handleOpen } = useConfirmAction(onDelete ?? emptyFn);

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <Page
            header={<PageHeader description={description} title={title} icon={icon} iconVariant={variant} onGoBack={handleGoBack} />}
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <View className="flex-row gap-2">
                            {isDefined(onDelete) ? <Button leftIcon="Trash2" onPress={handleOpen} variant="destructive" /> : null}
                            <Button leftIcon="RefreshCw" onPress={onSubmit} variant="positive" className="flex-1" content={buttonText} />
                        </View>
                    </Footer>
                </KeyboardStickyView>
            }
        >
            {children}

            <ConfirmActionBottomSheet
                ref={ref}
                variant="destructive"
                description={t`This action cannot be undone.`}
                buttonText={t`Delete transaction`}
                onSubmit={handleConfirm}
                icon="Info"
                title={t`Are you sure you want to delete this transaction?`}
            />
        </Page>
    );
};
