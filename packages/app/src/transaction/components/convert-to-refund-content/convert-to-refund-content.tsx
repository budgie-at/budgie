import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SearchInput } from '../../../@generic/component/search-input/search-input';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';
import { useConvertToRefundAction } from '../../hook/use-convert-to-refund-action.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { useRefundableExpenseCandidatesQuery } from '../../query/use-refundable-expense-candidates.query';
import { getTransactionListRowPosition } from '../../utils/get-transaction-list-row-position.util';
import { ConvertToRefundFooter } from '../convert-to-refund-footer/convert-to-refund-footer';
import { ConvertToRefundHeader } from '../convert-to-refund-header/convert-to-refund-header';
import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';

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
        <ScrollView
            className="flex-1"
            contentContainerClassName="grow px-xl pt-2xl"
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID={ConvertToRefundModalSelector.Picker}
        >
            <ConvertToRefundHeader />
            <SearchInput
                value={search}
                allowFontScaling
                containerClassName="h-auto min-h-[50px] py-sm"
                placeholder={t`Search expenses`}
                onChangeText={handleSearchChange}
                testID={ConvertToRefundModalSelector.SearchInput}
            />
            <LoadingContent isLoading={isLoading} containerClassName="grow shrink-0 pt-xl">
                {isNotEmptyString(errorMessage) ? (
                    <View className="gap-y-md py-xl">
                        <Text className="text-sm text-destructive-foreground">{errorMessage}</Text>
                        <Button content={t`Try again`} onPress={retry} variant="secondary" />
                    </View>
                ) : null}

                {showEmpty ? (
                    <EmptyState
                        circleIcon={UserIconNameEnum.SearchX}
                        title={t`No matching expenses`}
                        description={t`Try a different merchant, amount, or date.`}
                        className="px-sm py-3xl"
                        titleClassName="text-center font-semibold text-primary"
                        descriptionClassName="max-w-[260px] text-center text-secondary-foreground leading-5"
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
            <View className="shrink-0 pt-md pb-safe-or-[16px]">
                <ConvertToRefundFooter
                    selectedCandidate={selectedCandidate}
                    showRevert={showRevert}
                    onClose={handleResolve}
                    onConvert={convert}
                    isConverting={isConverting}
                    onRevert={revertRefund}
                />
            </View>
        </ScrollView>
    );
};
