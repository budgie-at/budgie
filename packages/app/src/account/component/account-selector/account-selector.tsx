import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useAccountSelectorModal } from '../../../@generic/context/account-selector-modal.context';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';

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
    const { openAccountSelector } = useAccountSelectorModal();
    const { selectedAccount, icon } = useAccountSelector({ accountId, excludeAccountTypes });

    const handleOpen = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: accountId,
            excludeAccountId,
            excludeAccountTypes,
            emptyStateDescription
        });

        if (isDefined(selectedAccountId)) {
            onSelect(selectedAccountId);
        }
    };

    const iconVariant = isDefined(selectedAccount) ? variant : 'secondary';

    return (
        <SimpleHorizontalCell
            variant={cardVariant}
            title={selectedAccount?.title ?? t`Select account`}
            description={description}
            left={<CircleIcon icon={icon} variant={iconVariant} />}
            onPress={handleOpen}
        />
    );
};
