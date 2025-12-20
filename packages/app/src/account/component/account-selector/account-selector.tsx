import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { EntitySelector } from '../../../@generic/components/entity-selector/entity-selector';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';

interface Props {
    readonly emptyStateDescription?: string;
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (accountId: number) => void;
    readonly className?: string;
    readonly status?: FormFieldStatus;
}

export const AccountSelector = ({ emptyStateDescription, accountId, onSelect, variant, className, status }: Props) => {
    const { selectedAccount, formattedBalance, icon, hasAccount, renderBottomSheet } = useAccountSelector({
        onSelect,
        accountId,
        emptyStateDescription
    });
    const { t } = useLingui();

    const subtitle = hasAccount ? (
        <Text className="text-xs font-medium text-secondary-foreground">
            <Trans>{formattedBalance} available</Trans>
        </Text>
    ) : null;

    return (
        <EntitySelector
            icon={icon}
            status={status}
            variant={variant}
            subtitle={subtitle}
            className={className}
            title={selectedAccount?.title}
            emptyStateText={t`Select account`}
            renderBottomSheet={renderBottomSheet}
        />
    );
};
