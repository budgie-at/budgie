import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useAccountSelectorModal } from '../../context/account-selector-modal.context';
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
    const { t } = useLingui();
    const { openAccountSelector } = useAccountSelectorModal();
    const { selectedAccount, formattedBalance, icon, hasAccount } = useAccountSelector({ accountId });

    const handleOpen = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: accountId,
            excludeAccountId,
            emptyStateDescription
        });

        if (isDefined(selectedAccountId)) {
            onSelect(selectedAccountId);
        }
    };

    const iconVariant = hasAccount ? variant : 'ghost';
    const subtitle = selectedAccount?.title ?? t`Select account`;
    const description = hasAccount ? formattedBalance : t`Tap to choose`;

    return (
        <Card onPress={handleOpen} className={cn(cardVariants({ status }), className)}>
            <View className="flex-row gap-x-md items-center mb-lg">
                <CircleIcon size={34} iconSize={18} icon={icon} variant={iconVariant} />
                <Text className="text-xxs text-secondary-foreground font-semibold">{title}</Text>
            </View>

            <Text className="text-primary mb-xs" numberOfLines={1}>
                {subtitle}
            </Text>
            <Text className="font-medium text-secondary-foreground text-xs">{description}</Text>
        </Card>
    );
};
