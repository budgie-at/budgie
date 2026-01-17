import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';
import { AccountSelectorBottomSheet } from '../account-selector-bottom-sheet/account-selector-bottom-sheet';

interface Props {
    readonly emptyStateDescription?: string;
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (accountId: number) => void;
    readonly cardVariant?: ColorPaletteVariant;
    readonly description?: string;
    readonly excludeAccountId?: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
}

export const AccountSelector = (props: Props) => {
    const {
        emptyStateDescription,
        accountId,
        onSelect,
        variant,
        cardVariant = 'primary',
        description,
        excludeAccountId,
        excludeAccountTypes
    } = props;

    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { selectedAccount, icon } = useAccountSelector({ accountId, excludeAccountTypes });

    const handleOpen = () => bottomSheetRef.current?.open();

    const iconVariant = isDefined(selectedAccount) ? variant : 'secondary';

    return (
        <>
            <SimpleHorizontalCell
                variant={cardVariant}
                title={selectedAccount?.title ?? t`Select account`}
                description={description}
                left={<CircleIcon icon={icon} variant={iconVariant} />}
                onPress={handleOpen}
            />

            <AccountSelectorBottomSheet
                emptyStateDescription={emptyStateDescription}
                selectedAccount={selectedAccount}
                excludeAccountId={excludeAccountId}
                excludeAccountTypes={excludeAccountTypes}
                onSelect={onSelect}
                ref={bottomSheetRef}
            />
        </>
    );
};
