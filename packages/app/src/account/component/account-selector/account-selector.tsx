import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';
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
    const { emptyStateDescription, accountId, onSelect, variant, status = 'default', description, excludeAccountTypes } = props;

    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { selectedAccount, icon } = useAccountSelector({ accountId, excludeAccountTypes });

    const handleOpen = () => bottomSheetRef.current?.open();

    const iconVariant = isDefined(selectedAccount) ? variant : 'secondary';
    const cardVariant = status === 'error' ? 'destructive' : 'primary';
    const iconParams = { variant: iconVariant, size: 38, iconSize: 18 };

    return (
        <>
            <SimpleHorizontalCell
                variant={cardVariant}
                title={selectedAccount?.title ?? t`Select account`}
                description={description}
                icon={icon}
                onPress={handleOpen}
                iconParams={iconParams}
            />

            <AccountSelectorBottomSheet
                emptyStateDescription={emptyStateDescription}
                selectedAccount={selectedAccount}
                excludeAccountTypes={excludeAccountTypes}
                onSelect={onSelect}
                ref={bottomSheetRef}
            />
        </>
    );
};
