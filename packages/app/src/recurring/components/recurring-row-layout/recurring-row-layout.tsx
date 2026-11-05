import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType | null;
    readonly title: string;
    readonly trailing: ReactNode;
    readonly children: ReactNode;
}

const rowVariants = cva('flex-row gap-x-xl', {
    variants: { isAccessibilityTextSize: { true: 'flex-wrap items-start gap-y-sm', false: 'min-h-11 items-center' } }
});

const labelsVariants = cva('flex-1 min-w-0 gap-y-xxs', {
    variants: { isAccessibilityTextSize: { true: '', false: 'min-h-[38px] justify-center mr-xs' } }
});

export const RecurringRowLayout = ({ icon, title, trailing, children }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    return (
        <View className={rowVariants({ isAccessibilityTextSize })}>
            <CircleIcon size={36} iconSize={18} radius={18} border={false} icon={icon ?? UserIconNameEnum.Wallet} variant="secondary" />
            <View className={labelsVariants({ isAccessibilityTextSize })}>
                <Text dynamicTypeRamp="headline" className="text-[16px] font-semibold text-primary" lineBreakStrategyIOS="standard">
                    {title}
                </Text>
                {children}
            </View>
            {trailing}
        </View>
    );
};
