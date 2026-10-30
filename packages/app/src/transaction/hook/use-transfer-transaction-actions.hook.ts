import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { TransactionActionsMenuSelector } from '../components/transaction-actions-menu/transaction-actions-menu.selector';

import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

export const useTransferTransactionActions = (transaction: TransactionWithRelationsEntityInterface, onFeePress: EmptyFn) => {
    const { t } = useLingui();
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transaction.id, () => void dismissAllOrReplace('/'));

    const items = [
        {
            key: 'fee',
            icon: UserIconNameEnum.ReceiptText,
            label: t`Set fee`,
            testID: TransactionActionsMenuSelector.FeeButton,
            onPress: onFeePress
        }
    ];

    return { transaction, isConsolidated, onRevert: handleRevert, items };
};
