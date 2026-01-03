import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../query/use-get-account-by-id.query';
import { AccountSelectorBottomSheet } from '../account-selector-bottom-sheet/account-selector-bottom-sheet';

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
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);
    const { balance } = useAccountBalanceQuery(accountId ?? 0);
    const formatDigits = useFormatDigits(decimalPlaces);

    const formattedBalance = formatDigits(balance, selectedAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const hasAccount = isDefined(selectedAccount);
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;

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

                <Text className="text-primary mb-xs" numberOfLines={1}>
                    {subtitle}
                </Text>
                <Text className="font-medium text-secondary-foreground text-xs">{description}</Text>
            </Card>

            <AccountSelectorBottomSheet
                emptyStateDescription={emptyStateDescription}
                selectedAccount={selectedAccount ?? null}
                excludeAccountId={excludeAccountId}
                onSelect={onSelect}
                ref={ref}
            />
        </>
    );
};
