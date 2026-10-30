import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';
import { useConvertToRefundAction } from '../../hook/use-convert-to-refund-action.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { useRefundableExpenseCandidatesQuery } from '../../query/use-refundable-expense-candidates.query';
import { ConvertToRefundFooter } from '../convert-to-refund-footer/convert-to-refund-footer';
import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';
import { TransactionPickerSearchDock } from '../transaction-picker-search-dock/transaction-picker-search-dock';

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
    const { candidates, errorMessage, isLoading } = useRefundableExpenseCandidatesQuery(refundIncomeTransactionId, search);
    const canonicalTransactionId = transaction?.consolidationParentTransactionId ?? refundIncomeTransactionId;
    const showRevert =
        transaction?.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
        isDefined(transaction?.consolidationParentTransactionId);

    const handleResolve = () => {
        resolveConvertToRefund(null);
    };

    const revertRefund = useRevertConsolidation(canonicalTransactionId, handleResolve, true);
    const convertToRefund = useConvertToRefundAction(refundIncomeTransactionId, selectedCandidate, resolveConvertToRefund);
    const hasCandidates = isNotEmptyArray(candidates);
    const showEmpty = !isLoading && isEmptyArray(candidates);

    return (
        <View className="flex-1 pt-2xl" collapsable={false} testID={ConvertToRefundModalSelector.Picker}>
            <View className="flex-1">
                {isNotEmptyString(errorMessage) ? (
                    <Text className="px-xl pb-md pt-xl text-sm text-destructive-foreground">{errorMessage}</Text>
                ) : null}

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator />
                    </View>
                ) : null}

                {showEmpty ? (
                    <EmptyState
                        circleIcon={UserIconNameEnum.SearchX}
                        title={t`No matching expenses`}
                        description={t`Try a different merchant, amount, or date.`}
                        className="flex-1 px-2xl py-0"
                        titleClassName="text-center"
                        descriptionClassName="max-w-[260px] text-center leading-5"
                    />
                ) : null}

                {hasCandidates ? (
                    <ScrollView
                        className="flex-1"
                        contentContainerClassName="px-xl pb-lg"
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {candidates.map((candidate, index) => (
                            <View key={candidate.id}>
                                {index > 0 ? <ListItemSeparator /> : null}
                                <TransactionPickerRow
                                    item={candidate}
                                    isSelected={selectedCandidate?.id === candidate.id}
                                    onPress={setSelectedCandidate}
                                    testID={ConvertToRefundModalSelector.CandidateRow(candidate.id)}
                                />
                            </View>
                        ))}
                    </ScrollView>
                ) : null}
            </View>

            <TransactionPickerSearchDock
                search={search}
                searchPlaceholder={t`Search expenses refunded by this income`}
                onSearchChange={setSearch}
                searchTestID={ConvertToRefundModalSelector.SearchInput}
            >
                <ConvertToRefundFooter
                    selectedCandidate={selectedCandidate}
                    showRevert={showRevert}
                    onClose={handleResolve}
                    onConvert={convertToRefund}
                    onRevert={revertRefund}
                />
            </TransactionPickerSearchDock>
        </View>
    );
};
