import { ReactNode } from 'react';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';

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

export const TransactionFormLayout = ({ title, description, icon, variant, buttonText, onSubmit, children, onDelete }: Props) => {
    const handleGoBack = () => void goBackOrReplace('/');

    const renderDeleteButton = () => {
        if (!isDefined(onDelete)) {
            return null;
        }

        return (
            <HapticPressable className="p-md" onPress={onDelete}>
                <Icon icon="Trash2" className="text-destructive" size={24} />
            </HapticPressable>
        );
    };

    return (
        <Page
            header={
                <PageHeader
                    description={description}
                    title={title}
                    icon={icon}
                    iconVariant={variant}
                    onGoBack={handleGoBack}
                    right={renderDeleteButton()}
                />
            }
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <Button onPress={onSubmit} variant={variant} content={buttonText} />
                    </Footer>
                </KeyboardStickyView>
            }
        >
            {children}
        </Page>
    );
};
