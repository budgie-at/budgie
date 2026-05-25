import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useConvertToRefundAction } from '../../hooks/use-convert-to-refund-action.hook';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { useRefundableExpenseCandidatesQuery } from '../../query/use-refundable-expense-candidates.query';
import { ConvertToRefundFooter } from '../convert-to-refund-footer/convert-to-refund-footer';
import { TransactionPicker } from '../transaction-picker/transaction-picker';

import type { ConvertToRefundContentPropsInterface } from '../../interface/convert-to-refund-content-props.interface';
import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

export const ConvertToRefundContent = ({ refundIncomeTransactionId, resolveConvertToRefund }: ConvertToRefundContentPropsInterface) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<TransactionPickerItemInterface | null>(null);
    const { transaction } = useGetTransactionByIdQuery(refundIncomeTransactionId);
    const { candidates, errorMessage, isLoading } = useRefundableExpenseCandidatesQuery(refundIncomeTransactionId, search);
    const canonicalTransactionId = transaction?.consolidationParentTransactionId ?? refundIncomeTransactionId;
    const showRevert =
        transaction?.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
        isDefined(transaction?.consolidationParentTransactionId);
    const selectedCandidateId = selectedCandidate?.id ?? null;
    const searchPlaceholder = t`Search expenses refunded by this income`;

    const handleResolve = () => {
        resolveConvertToRefund(null);
    };

    const revertRefund = useRevertConsolidation(canonicalTransactionId, handleResolve);
    const convertToRefund = useConvertToRefundAction(refundIncomeTransactionId, selectedCandidate, resolveConvertToRefund);
    const footer = (
        <ConvertToRefundFooter
            selectedCandidate={selectedCandidate}
            showRevert={showRevert}
            onClose={handleResolve}
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
            emptyTitle={t`No matching expenses`}
            emptyDescription={t`Try a different merchant, amount, or date.`}
            footer={footer}
            onSearchChange={setSearch}
            onSelectItem={setSelectedCandidate}
            testID={ConvertToRefundModalSelector.Picker}
            searchTestID={ConvertToRefundModalSelector.SearchInput}
            rowTestID={ConvertToRefundModalSelector.CandidateRow}
        />
    );
};
