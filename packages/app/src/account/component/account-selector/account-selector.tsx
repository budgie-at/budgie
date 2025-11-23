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
import { useGetAccountByIdQuery } from '../../query/use-get-account-by-id.query';
import { AccountSelectorBottomSheet } from '../account-selector-bottom-sheet/account-selector-bottom-sheet';

interface Props {
    readonly emptyStateDescription?: string;
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (accountId: number) => void;
    readonly className?: string;
}

export const AccountSelector = ({ emptyStateDescription, accountId, onSelect, variant, className }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);

    const handleOpen = () => ref.current?.open();

    const currentBalance = isDefined(selectedAccount) ? formatMoney(selectedAccount.currentBalance) : '';
    const icon = selectedAccount?.icon ?? 'Wallet';

    return (
        <>
            <Card onPress={handleOpen} className={cn('flex-row items-center gap-x-xl', className)}>
                <CircleIcon size="lg" icon={ICONS[icon]} variant={variant} />

                {isDefined(selectedAccount) ? (
                    <View className="mr-auto">
                        <Text className="text-sm text-primary font-semibold">{selectedAccount.title}</Text>
                        <Text className="text-xs font-medium text-secondary-foreground">
                            <Trans>{currentBalance} available</Trans>
                        </Text>
                    </View>
                ) : (
                    <Text className="flex-1 text-center font-semibold text-primary text-sm">
                        <Trans>Select account</Trans>
                    </Text>
                )}

                <CircleIcon icon={ICONS.ChevronRight} className="bg-transparent border-0" variant="ghost" />
            </Card>

            <AccountSelectorBottomSheet
                emptyStateDescription={emptyStateDescription}
                selectedAccount={selectedAccount}
                excludeAccountId={null}
                onSelect={onSelect}
                ref={ref}
            />
        </>
    );
};
