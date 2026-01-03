import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { EntitySelector } from '../../../@generic/component/entity-selector/entity-selector';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useGetAccountByIdQuery } from '../../query/use-get-account-by-id.query';
import { AccountSelectorBottomSheet } from '../account-selector-bottom-sheet/account-selector-bottom-sheet';

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
    const { t } = useLingui();
    const ref = useRef<BottomSheetInterface | null>(null);
    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);

    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;
    const iconVariant = isDefined(selectedAccount) ? variant : 'secondary';

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <EntitySelector
                icon={icon}
                status={status}
                variant={variant}
                iconVariant={iconVariant}
                description={description}
                onPress={handleOpen}
                title={selectedAccount?.title ?? t`Select account`}
            />

            <AccountSelectorBottomSheet
                emptyStateDescription={emptyStateDescription}
                selectedAccount={selectedAccount ?? null}
                excludeAccountId={null}
                excludeAccountTypes={excludeAccountTypes}
                onSelect={onSelect}
                ref={ref}
            />
        </>
    );
};
