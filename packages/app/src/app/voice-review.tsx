import { AITransactionInterface } from '@budgie/ai';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useGetAccountByIdQuery } from '../account/query/use-get-account-by-id.query';
import { VoiceReviewFooter } from '../ai/component/voice-review-footer/voice-review-footer';
import { useVoiceReviewModal } from '../ai/context/voice-review-modal.context';
import { useVoiceReview } from '../ai/hook/use-voice-review.hook';
import { VoiceReviewRowInterface } from '../ai/interface/voice-review-row.interface';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { useSettingsContext } from '../settings/context/settings.context';
import { SplitEntryRow } from '../transaction/components/split-entry-row/split-entry-row';

const SCROLL_BOTTOM_PADDING = 16;
const SCROLL_CONTENT_STYLE = { paddingBottom: SCROLL_BOTTOM_PADDING } as const;

const sumAmounts = (rows: { readonly amount: number }[]): number => rows.reduce((accumulator, row) => accumulator + row.amount, 0);

const mapExtractedToReviewRows = (transactions: AITransactionInterface[]): VoiceReviewRowInterface[] => {
    const usedCategoryIds = new Set<number>();

    return transactions.map((transaction, index) => {
        const suggestedCategoryId = transaction.category?.id ?? null;
        const categoryId = isPositiveNumber(suggestedCategoryId) && !usedCategoryIds.has(suggestedCategoryId) ? suggestedCategoryId : null;

        if (isPositiveNumber(categoryId)) {
            usedCategoryIds.add(categoryId);
        }

        return {
            id: `voice-row-${Date.now()}-${index}`,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.comment,
            accountId: transaction.account?.id ?? null,
            categoryId
        };
    });
};

// eslint-disable-next-line max-statements, max-lines-per-function -- Form-sheet route orchestrates per-row category, save, and re-record
export default function VoiceReviewModal() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const [, resolveVoiceReview, currentParams] = useVoiceReviewModal();
    const [openCategorySelector] = useCategorySelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const initialRows = isDefined(currentParams) ? mapExtractedToReviewRows(currentParams.transactions) : [];
    const originalText = currentParams?.originalText ?? '';
    const { rows, isSaving, canSave, hasInvalidAmounts, hasMissingCategories, editAmount, setCategory, deleteRow, saveAll } =
        useVoiceReview(initialRows);

    const totalAmount = sumAmounts(rows);
    const accountId = defaultAccount?.id ?? null;
    const { account: accountWithInstrument } = useGetAccountByIdQuery(accountId ?? 0);
    const currencySymbol = accountWithInstrument?.instrument.symbol ?? '';
    const canDelete = rows.length > 1;

    const handleCategoryPress = async (rowId: string, currentCategoryId: number | null) => {
        const excludeCategoryIds = rows
            .filter(row => row.id !== rowId)
            .map(row => row.categoryId)
            .filter(isPositiveNumber);
        const selectedCategoryId = await openCategorySelector({
            initialCategoryId: currentCategoryId,
            excludeCategoryIds,
            variant: 'destructive'
        });

        if (isDefined(selectedCategoryId)) {
            setCategory(rowId, selectedCategoryId);
        }
    };

    const handleCancel = () => void resolveVoiceReview({ kind: 'cancelled' });
    const handleReRecord = () => void resolveVoiceReview({ kind: 're-record' });

    const resolveRef = useRef(resolveVoiceReview);
    useEffect(() => {
        resolveRef.current = resolveVoiceReview;
    });

    useEffect(() => () => void resolveRef.current({ kind: 're-record' }, { skipBack: true }), []);
    const handleSave = async () => {
        if (!isPositiveNumber(accountId)) {
            return;
        }
        const result = await saveAll(accountId);
        if (!isDefined(result)) {
            return;
        }
        resolveVoiceReview({
            kind: 'saved',
            transactionIds: result.transactions.map(transaction => transaction.id),
            accountId: result.destinationAccountId
        });
    };

    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View style={containerStyle} collapsable={false}>
            {isNotEmptyString(originalText) ? (
                <View className="mx-lg mb-lg mt-2xl flex-row gap-x-md rounded-2xl bg-secondary-background px-lg py-md">
                    <View className="w-[2px] rounded-full bg-secondary-foreground/30" />
                    <Text className="flex-1 text-lg leading-snug text-primary" numberOfLines={4}>
                        {originalText}
                    </Text>
                </View>
            ) : null}

            <ScrollView className="flex-1" contentContainerStyle={SCROLL_CONTENT_STYLE} keyboardShouldPersistTaps="handled">
                {isEmptyArray(rows) ? (
                    <View className="items-center px-lg py-3xl">
                        <Text className="text-md text-secondary-foreground">{t`No items to save`}</Text>
                        <Text className="mt-xs text-sm text-secondary-foreground opacity-60">{t`Tap re-record to try again`}</Text>
                    </View>
                ) : (
                    <View className="gap-y-md px-lg">
                        {rows.map((row, index) => {
                            const handleAmount = (amount: number) => void editAmount(row.id, amount);
                            const handleCategory = () => void handleCategoryPress(row.id, row.categoryId);
                            const handleDelete = () => void deleteRow(row.id);

                            return (
                                <SplitEntryRow
                                    key={row.id}
                                    index={index}
                                    categoryId={row.categoryId ?? 0}
                                    amount={row.amount}
                                    currencySymbol={currencySymbol}
                                    variant="destructive"
                                    canDelete={canDelete}
                                    autoFocus={false}
                                    onAmountChange={handleAmount}
                                    onCategoryPress={handleCategory}
                                    onDelete={handleDelete}
                                />
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            <VoiceReviewFooter
                count={rows.length}
                totalAmount={totalAmount}
                currencySymbol={currencySymbol}
                canSave={canSave}
                hasInvalidAmounts={hasInvalidAmounts}
                hasMissingCategories={hasMissingCategories}
                isSaving={isSaving}
                onCancel={handleCancel}
                onReRecord={handleReRecord}
                onSave={handleSave}
            />
        </View>
    );
}
