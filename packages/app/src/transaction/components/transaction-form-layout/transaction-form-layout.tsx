import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
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

const safeEdges = ['bottom'] as const;

const buttonVariants = cva('', {
    variants: {
        variant: BACKGROUND_COLOR_PALETTE
    }
});

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
                <View className="border-t border-t-secondary-corner pt-5xl px-5xl">
                    <SafeAreaView edges={safeEdges}>
                        <Button
                            onPress={onSubmit}
                            className={buttonVariants({ variant })}
                            textClassName="text-white"
                            content={buttonText}
                        />
                    </SafeAreaView>
                </View>
            }
        >
            {children}
        </Page>
    );
};
