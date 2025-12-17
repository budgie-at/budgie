import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
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
    readonly className?: string;
    readonly title: string;
}

export const AccountSelectorSquare = ({
    emptyStateDescription,
    excludeAccountId,
    accountId,
    title,
    onSelect,
    variant,
    className
}: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const { defaultCurrency, decimalPlaces } = useSettingsContext();

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);

    const { balance } = useAccountBalanceQuery(accountId ?? 0);
    const formatMoney = useFormatMoney(decimalPlaces, selectedAccount?.instrument.code ?? defaultCurrency);

    const handleOpen = () => ref.current?.open();

    return (
        <>
            <Card onPress={handleOpen} className={cn('flex-row items-center gap-x-xl', className)}>
                {isDefined(selectedAccount) ? (
                    <View>
                        <View className="flex-row gap-x-md items-center mb-lg">
                            <CircleIcon size="lg" icon={ICONS[selectedAccount.icon]} variant={variant} />
                            <Text className="text-xxs text-secondary-foreground font-semibold">{title}</Text>
                        </View>
                        <Text className="text-primary mb-xs">{selectedAccount.title}</Text>
                        <Text className="font-medium text-secondary-foreground text-xs">{formatMoney(balance)}</Text>
                    </View>
                ) : (
                    <View>
                        <View className="flex-row gap-x-md items-center mb-lg">
                            <CircleIcon size="lg" icon={ICONS.Wallet} variant="ghost" />
                            <Text className="text-xxs text-secondary-foreground font-semibold">{title}</Text>
                        </View>
                        <Text className="text-primary mb-xs">
                            <Trans>Select account</Trans>
                        </Text>
                        <Text className="font-medium text-secondary-foreground text-xs">
                            <Trans>Tap to choose</Trans>
                        </Text>
                    </View>
                )}
            </Card>

            <AccountSelectorBottomSheet
                emptyStateDescription={emptyStateDescription}
                excludeAccountId={excludeAccountId}
                selectedAccount={selectedAccount}
                onSelect={onSelect}
                ref={ref}
            />
        </>
    );
};
