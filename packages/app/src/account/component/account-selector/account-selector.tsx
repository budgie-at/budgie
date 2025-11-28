import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EntitySelector } from '../../../@generic/components/entity-selector/entity-selector';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
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
    readonly error?: string;
    readonly status?: FormFieldStatus;
}

export const AccountSelector = ({ emptyStateDescription, accountId, onSelect, variant, className, error, status }: Props) => {
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
            error={error}
            status={status}
            emptyStateText={t`Select account`}
            title={selectedAccount?.title}
            subtitle={subtitle}
            renderBottomSheet={renderBottomSheet}
        />
    );
};
