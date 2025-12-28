import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';

interface Props {
    readonly emptyStateDescription?: string;
    readonly accountId: number | null;
    readonly excludeAccountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (accountId: number) => void;
    readonly status?: FormFieldStatus;
    readonly className?: string;
    readonly title: string;
}

const cardVariants = cva('', {
    variants: {
        status: {
            error: 'border-destructive-corner bg-destructive-background/5',
            default: ''
        }
    }
});

export const AccountSelectorSquare = ({
    emptyStateDescription,
    excludeAccountId,
    accountId,
    title,
    onSelect,
    status = 'default',
    variant,
    className
}: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const { selectedAccount, formattedBalance, icon, hasAccount, renderBottomSheet } = useAccountSelector({
        accountId,
        excludeAccountId,
        emptyStateDescription,
        onSelect
    });

    const handleOpen = () => ref.current?.open();

    const iconVariant = hasAccount ? variant : 'ghost';
    const subtitle = selectedAccount?.title ?? t`Select account`;
    const description = hasAccount ? formattedBalance : t`Tap to choose`;

    return (
        <>
            <Card onPress={handleOpen} className={cn(cardVariants({ status }), className)}>
                <View className="flex-row gap-x-md items-center mb-lg">
                    <CircleIcon size={34} iconSize={18} icon={icon} variant={iconVariant} />
                    <Text className="text-xxs text-secondary-foreground font-semibold">{title}</Text>
                </View>

                <Text className="text-primary mb-xs">{subtitle}</Text>
                <Text className="font-medium text-secondary-foreground text-xs">{description}</Text>
            </Card>

            {renderBottomSheet(ref)}
        </>
    );
};
