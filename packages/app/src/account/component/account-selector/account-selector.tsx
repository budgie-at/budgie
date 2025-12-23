import { useLingui } from '@lingui/react/macro';

import { EntitySelector } from '../../../@generic/components/entity-selector/entity-selector';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';
import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly emptyStateDescription?: string;
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (accountId: number) => void;
    readonly className?: string;
    readonly status?: FormFieldStatus;
    readonly description?: string;
}

export const AccountSelector = ({ emptyStateDescription, accountId, onSelect, variant, className, status, description }: Props) => {
    const { selectedAccount, icon, renderBottomSheet } = useAccountSelector({
        onSelect,
        accountId,
        emptyStateDescription
    });
    const { t } = useLingui();

    // eslint-disable-next-line no-undefined
    // const description = hasAccount ? t`${formattedBalance} available` : undefined;

    const titleVariant = isDefined(selectedAccount) ? 'primary' : 'secondary';
    const iconVariant = isDefined(selectedAccount) ? variant : 'secondary';

    return (
        <EntitySelector
            icon={icon}
            status={status}
            variant={variant}
            iconVariant={iconVariant}
            className={className}
            description={description}
            titleVariant={titleVariant}
            renderBottomSheet={renderBottomSheet}
            title={selectedAccount?.title ?? t`Select account`}
        />
    );
};
