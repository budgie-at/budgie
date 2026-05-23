import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useConvertToRefundAction } from '../../hooks/use-convert-to-refund-action.hook';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { useRefundMatchCandidatesQuery } from '../../query/use-refund-match-candidates.query';
import { ConvertToRefundFooter } from '../convert-to-refund-footer/convert-to-refund-footer';
import { TransactionPicker } from '../transaction-picker/transaction-picker';

import type { ConvertToRefundContentPropsInterface } from '../../interface/convert-to-refund-content-props.interface';
import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

export const ConvertToRefundContent = ({ transactionId, resolveConvertToRefund }: ConvertToRefundContentPropsInterface) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<TransactionPickerItemInterface | null>(null);
    const { transaction } = useGetTransactionByIdQuery(transactionId);
    const { candidates, errorMessage, isLoading } = useRefundMatchCandidatesQuery(transactionId, search);
    const canonicalTransactionId = transaction?.consolidationParentTransactionId ?? transactionId;
    const showRevert =
        transaction?.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
        isDefined(transaction?.consolidationParentTransactionId);
    const selectedCandidateId = selectedCandidate?.id ?? null;
    const searchPlaceholder =
        transaction?.type === TransactionTypeEnum.INCOME
            ? t`Search expenses refunded by this income`
            : t`Search income refunds up to this expense`;

    const handleClose = () => {
        resolveConvertToRefund(null);
    };

    const handleRevertSuccess = () => {
        resolveConvertToRefund(null, { skipBack: true });
        dismissAllOrReplace('/');
    };

    const revertRefund = useRevertConsolidation(canonicalTransactionId, handleRevertSuccess);
    const convertToRefund = useConvertToRefundAction(transactionId, selectedCandidate, resolveConvertToRefund);
    const footer = (
        <ConvertToRefundFooter
            selectedCandidate={selectedCandidate}
            showRevert={showRevert}
            onClose={handleClose}
            onConvert={convertToRefund}
            onRevert={revertRefund}
        />
    );

    return (
        <TransactionPicker
            items={candidates}
            selectedItemId={selectedCandidateId}
            search={search}
            searchPlaceholder={searchPlaceholder}
            isLoading={isLoading}
            errorMessage={errorMessage}
            emptyTitle={t`No matching transactions`}
            emptyDescription={t`Try another search or choose a same-currency opposite transaction with a valid refund amount.`}
            footer={footer}
            onSearchChange={setSearch}
            onSelectItem={setSelectedCandidate}
            testID={ConvertToRefundModalSelector.Picker}
            searchTestID={ConvertToRefundModalSelector.SearchInput}
            rowTestID={ConvertToRefundModalSelector.CandidateRow}
        />
    );
};
