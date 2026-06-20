import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly isVisible: boolean;
    readonly onAttach: EmptyFn;
}

export const TransactionListAttachDebtMenuItem = ({ isVisible, onAttach }: Props) => {
    const { t } = useLingui();

    if (!isVisible) {
        return null;
    }

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.HandCoins}
            label={t`Attach debt`}
            onPress={onAttach}
            testID={TransactionListContextMenuSelector.AttachDebtSettlementButton}
        />
    );
};
