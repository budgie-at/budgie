import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EntitySelector } from '../../../@generic/components/entity-selector/entity-selector';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
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
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);
    const { t } = useLingui();

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);

    const currentBalance = isDefined(selectedAccount) ? formatMoney(selectedAccount.currentBalance) : '';
    const icon = selectedAccount?.icon ?? 'Wallet';

    const subtitle = isDefined(selectedAccount) ? (
        <Text className="text-xs font-medium text-secondary-foreground">
            <Trans>{currentBalance} available</Trans>
        </Text>
    ) : null;

    const renderBottomSheet = (ref: RefObject<BottomSheetInterface | null>) => (
        <AccountSelectorBottomSheet
            emptyStateDescription={emptyStateDescription}
            selectedAccount={selectedAccount}
            excludeAccountId={null}
            onSelect={onSelect}
            ref={ref}
        />
    );

    return (
        <EntitySelector
            variant={variant}
            className={className}
            icon={icon}
            emptyStateText={t`Select account`}
            title={selectedAccount?.title}
            subtitle={subtitle}
            renderBottomSheet={renderBottomSheet}
        />
    );
};
