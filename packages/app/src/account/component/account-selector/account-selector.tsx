import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { EntitySelector } from '../../../@generic/component/entity-selector/entity-selector';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';

interface Props {
    readonly emptyStateDescription?: string;
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (accountId: number) => void;
    readonly status?: FormFieldStatus;
    readonly description?: string;
    readonly excludeAccountTypes?: AccountTypeEnum[];
}

export const AccountSelector = (props: Props) => {
    const { emptyStateDescription, accountId, onSelect, variant, status, description, excludeAccountTypes } = props;
    const { selectedAccount, icon, renderBottomSheet } = useAccountSelector({
        onSelect,
        accountId,
        excludeAccountTypes,
        emptyStateDescription
    });
    const { t } = useLingui();

    const iconVariant = isDefined(selectedAccount) ? variant : 'secondary';

    return (
        <EntitySelector
            icon={icon}
            status={status}
            variant={variant}
            iconVariant={iconVariant}
            description={description}
            renderBottomSheet={renderBottomSheet}
            title={selectedAccount?.title ?? t`Select account`}
        />
    );
};
