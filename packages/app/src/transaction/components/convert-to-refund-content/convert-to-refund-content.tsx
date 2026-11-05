import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SearchInput } from '../../../@generic/component/search-input/search-input';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';
import { useConvertToRefundAction } from '../../hook/use-convert-to-refund-action.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { useRefundableExpenseCandidatesQuery } from '../../query/use-refundable-expense-candidates.query';
import { getTransactionListRowPosition } from '../../utils/get-transaction-list-row-position.util';
import { ConvertToRefundFooter } from '../convert-to-refund-footer/convert-to-refund-footer';
import { TransactionPickerContext } from '../transaction-picker-context/transaction-picker-context';
import { TransactionPickerEmpty } from '../transaction-picker-empty/transaction-picker-empty';
import { TransactionPickerFailure } from '../transaction-picker-failure/transaction-picker-failure';
import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';
import { TransactionPickerSheetHeader } from '../transaction-picker-sheet-header/transaction-picker-sheet-header';
import { TransactionPickerSheet } from '../transaction-picker-sheet/transaction-picker-sheet';

import type { ConvertToRefundModalResolveType } from '../../interface/convert-to-refund-modal-resolve.type';
import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly refundIncomeTransactionId: number;
    readonly resolveConvertToRefund: ConvertToRefundModalResolveType;
}

export const ConvertToRefundContent = ({ refundIncomeTransactionId, resolveConvertToRefund }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<TransactionPickerItemInterface | null>(null);
    const { transaction } = useGetTransactionByIdQuery(refundIncomeTransactionId);
    const { candidates, errorMessage, isLoading, retry } = useRefundableExpenseCandidatesQuery(refundIncomeTransactionId, search);
    const canonicalTransactionId = transaction?.consolidationParentTransactionId ?? refundIncomeTransactionId;
    const showRevert =
        transaction?.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
        isDefined(transaction?.consolidationParentTransactionId);

    const handleResolve = () => {
        resolveConvertToRefund(null);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setSelectedCandidate(null);
    };

    const revertRefund = useRevertConsolidation(canonicalTransactionId, handleResolve, true);
    const { convert, isLoading: isConverting } = useConvertToRefundAction(
        refundIncomeTransactionId,
        selectedCandidate,
        resolveConvertToRefund
    );
    const showEmpty = isEmptyArray(candidates) && !isNotEmptyString(errorMessage);

    return (
        <TransactionPickerSheet
            header={
                <TransactionPickerSheetHeader title={t`Refund`} closeLabel={t`Cancel`} onClose={handleResolve} disabled={isConverting} />
            }
            footer={
                <ConvertToRefundFooter
                    selectedCandidate={selectedCandidate}
                    showRevert={showRevert}
                    onConvert={convert}
                    isConverting={isConverting}
                    onRevert={revertRefund}
                />
            }
        >
            <ScrollView
                className="flex-1"
                contentContainerClassName="grow px-xl pb-xl"
                automaticallyAdjustKeyboardInsets
                keyboardShouldPersistTaps="handled"
                testID={ConvertToRefundModalSelector.Picker}
            >
                <TransactionPickerContext transactionId={refundIncomeTransactionId} label={t`Refund`} />
                <SearchInput
                    value={search}
                    allowFontScaling
                    containerClassName="h-auto min-h-[50px] py-sm"
                    placeholder={t`Search expenses`}
                    onChangeText={handleSearchChange}
                    testID={ConvertToRefundModalSelector.SearchInput}
                />
                <Text
                    dynamicTypeRamp="footnote"
                    accessibilityRole="header"
                    className="pt-xl pb-md text-[13px] font-semibold text-secondary-foreground"
                >
                    <Trans>Original expense</Trans>
                </Text>
                <LoadingContent isLoading={isLoading} containerClassName="grow shrink-0">
                    {isNotEmptyString(errorMessage) ? <TransactionPickerFailure onRetry={retry} /> : null}
                    {showEmpty ? (
                        <TransactionPickerEmpty
                            icon={UserIconNameEnum.SearchX}
                            title={t`No matching expenses`}
                            description={t`Try a different merchant, amount, or date.`}
                        />
                    ) : null}
                    {candidates.map((candidate, index) => (
                        <TransactionPickerRow
                            key={candidate.id}
                            position={getTransactionListRowPosition(index, candidates.length)}
                            item={candidate}
                            isSelected={selectedCandidate?.id === candidate.id}
                            onPress={setSelectedCandidate}
                            testID={ConvertToRefundModalSelector.CandidateRow(candidate.id)}
                        />
                    ))}
                </LoadingContent>
            </ScrollView>
        </TransactionPickerSheet>
    );
};
