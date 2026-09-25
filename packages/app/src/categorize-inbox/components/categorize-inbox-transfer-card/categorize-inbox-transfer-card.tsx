import { AccountTypeEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { getErrorMessage, isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { testID } from '../../../@generic/utils/test-id.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { transactionTransferService } from '../../../transaction/service/transaction-transfer.service';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxTransferKindEnum } from '../../enum/categorize-inbox-transfer-kind.enum';
import { CategorizeInboxClusterRows } from '../categorize-inbox-cluster-rows/categorize-inbox-cluster-rows';
import { CategorizeInboxClusterSummary } from '../categorize-inbox-cluster-summary/categorize-inbox-cluster-summary';
import { CategorizeInboxSuggestionChips } from '../categorize-inbox-suggestion-chips/categorize-inbox-suggestion-chips';

import { CategorizeInboxTransferCardSelector } from './categorize-inbox-transfer-card.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxTransferCard = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { excludedTransactionIds, isBusy, runExclusive } = useCategorizeInboxContext();
    const [openAccountSelector] = useAccountSelectorModal();

    const isAtmWithdrawal = cluster.transferKind === CategorizeInboxTransferKindEnum.ATM_WITHDRAWAL;
    const transactionIds = cluster.rows.map(row => row.transactionId).filter(transactionId => !excludedTransactionIds.has(transactionId));

    const handleConvert = async (accountId: number): Promise<void> => {
        const transactionType = cluster.type === TransactionTypeEnum.INCOME ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
        const result = await transactionTransferService.convertManyToTransfer(transactionIds, transactionType, accountId);

        if (isPositiveNumber(result.failed)) {
            showErrorToast(t`Some transactions could not be converted`, t`Please try again later`);
        }
    };

    const handleMove = async (): Promise<void> => {
        const accountId = await openAccountSelector(
            isAtmWithdrawal
                ? {
                      includeAccountTypes: [AccountTypeEnum.CASH],
                      excludeAccountId: cluster.sourceAccountId,
                      onlyActive: true,
                      emptyStateDescription: t`Create a cash account to track ATM withdrawals`
                  }
                : { excludeAccountTypes: [AccountTypeEnum.DEBT], excludeAccountId: cluster.sourceAccountId, onlyActive: true }
        );

        if (!isDefined(accountId) || isEmptyArray(transactionIds)) {
            return;
        }

        const isConfirmed = await confirmAlert({
            title: t({
                message: plural(transactionIds.length, {
                    one: 'Move # transaction to this account?',
                    other: 'Move # transactions to this account?'
                })
            }),
            confirmText: t`Move`,
            cancelText: t`Cancel`
        });

        if (isConfirmed) {
            await runExclusive(() => handleConvert(accountId));
        }
    };

    const handleMovePress = (): void =>
        void handleMove().catch(
            (error: unknown) => void showErrorToast(t`Some transactions could not be converted`, getErrorMessage(error))
        );

    const countText = isAtmWithdrawal
        ? t({ message: plural(cluster.rows.length, { one: '# ATM withdrawal', other: '# ATM withdrawals' }) })
        : t({ message: plural(cluster.rows.length, { one: '# card transfer', other: '# card transfers' }) });
    const icon = isAtmWithdrawal ? UserIconNameEnum.Banknote : UserIconNameEnum.ArrowRightLeft;

    return (
        <Card size="md" className="gap-y-lg" {...testID(CategorizeInboxTransferCardSelector.Card, cluster.key)}>
            <CategorizeInboxClusterSummary cluster={cluster} countText={countText} icon={icon} />

            <Button
                content={t`Move to account…`}
                variant="cta"
                size="sm"
                onPress={handleMovePress}
                disabled={isBusy}
                {...testID(CategorizeInboxTransferCardSelector.MoveButton, cluster.key)}
            />

            <Text className="text-secondary-foreground text-xs">
                <Trans>Or categorize as</Trans>
            </Text>

            <CategorizeInboxSuggestionChips cluster={cluster} />

            <CategorizeInboxClusterRows cluster={cluster} />
        </Card>
    );
};
