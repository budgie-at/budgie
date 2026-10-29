import { AccountTypeEnum } from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';

import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';
import type { CategorizeInboxClusterInterface, CategorizeInboxRowInterface } from '@budgie/categorization';

export const useCategorizeInboxConvertToTransfer = (
    visibility: Pick<CategorizeInboxVisibilityInterface, 'hideTransactions' | 'showTransactions' | 'includedRows'>,
    enqueueWrite: CategorizeInboxEnqueueWriteType
) => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const [openAccountSelector] = useAccountSelectorModal();

    const convertToAccount = (transactionIds: number[], accountId: number): void => {
        visibility.hideTransactions(transactionIds);
        enqueueWrite(
            Effect.gen(function* () {
                const transactionTransferService = yield* TransactionTransferService;
                const convertedIds = yield* transactionTransferService.convertManyToTransferAccount(transactionIds, accountId);
                const skippedIds = transactionIds.filter(transactionId => !convertedIds.includes(transactionId));

                visibility.showTransactions(skippedIds);

                if (isNotEmptyArray(convertedIds)) {
                    hapticNotification(NotificationFeedbackType.Success);
                }
            }),
            () => void visibility.showTransactions(transactionIds),
            t`Could not convert to transfers`
        );
    };

    const convertTransactionsToTransfer = (rows: CategorizeInboxRowInterface[]): void => {
        if (isNotEmptyArray(rows)) {
            openAccountSelector(
                {
                    excludeAccountTypes: [AccountTypeEnum.DEBT],
                    onlyActive: true
                },
                accountId => {
                    if (isDefined(accountId)) {
                        convertToAccount(
                            rows.map(row => row.transactionId),
                            accountId
                        );
                    }
                }
            );
        }
    };

    return {
        convertClusterToTransfer: (cluster: CategorizeInboxClusterInterface) =>
            void convertTransactionsToTransfer(visibility.includedRows(cluster)),
        convertRowToTransfer: (row: CategorizeInboxRowInterface) => void convertTransactionsToTransfer([row])
    };
};
