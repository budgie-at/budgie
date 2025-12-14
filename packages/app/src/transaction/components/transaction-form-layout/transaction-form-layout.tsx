import { router } from 'expo-router';
import { ReactNode } from 'react';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { Footer } from '../../../@generic/components/footer/footer';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly children: ReactNode;
}

export const TransactionFormLayout = ({ title, description, icon, variant, buttonText, onSubmit, children }: Props) => {
    const goBack = () => void router.back();

    return (
        <Page
            header={
                <PageHeader
                    right={
                        <HapticPressable className="p-md rounded-full active:bg-primary/1" onPress={goBack}>
                            <Icon icon={ICONS.X} size={24} className="text-secondary-foreground" />
                        </HapticPressable>
                    }
                    description={description}
                    title={title}
                    icon={icon}
                    iconVariant={variant}
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
