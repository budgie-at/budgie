import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';

import { useSaveTransactionYield } from './use-save-transaction-yield.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useOpenYieldKindPicker = (transaction: Pick<TransactionWithRelationsEntityInterface, 'id' | 'type' | 'yieldKind'>) => {
    const openKindSelector = useOpenModal('/yield-kind');
    const save = useSaveTransactionYield(transaction.id);

    return () =>
        void openKindSelector({ transactionType: transaction.type, selectedKind: transaction.yieldKind }, kind => {
            if (isDefined(kind)) {
                save({ yieldKind: kind });
            }
        });
};
