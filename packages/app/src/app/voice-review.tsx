import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useGetAccountByIdQuery } from '../account/query/use-get-account-by-id.query';
import { VoiceReviewFooter } from '../ai/component/voice-review-footer/voice-review-footer';
import { useVoiceReviewModal } from '../ai/context/voice-review-modal.context';
import { useVoiceReview } from '../ai/hook/use-voice-review.hook';
import { mapExtractedToReviewRows } from '../ai/utils/map-extracted-to-review-rows.util';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { useSettingsContext } from '../settings/context/settings.context';
import { SplitEntryRow } from '../transaction/components/split-entry-row/split-entry-row';

const SCROLL_BOTTOM_PADDING = 16;
const SCROLL_CONTENT_STYLE = { paddingBottom: SCROLL_BOTTOM_PADDING } as const;

const sumAmounts = (rows: { readonly amount: number }[]): number =>
    rows.reduce((accumulator, row) => accumulator + row.amount, 0);

// eslint-disable-next-line max-statements, max-lines-per-function -- Form-sheet route orchestrates per-row category, save, and re-record
export default function VoiceReviewModal() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const [, resolveVoiceReview, currentParams] = useVoiceReviewModal();
    const [openCategorySelector] = useCategorySelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const initialRows = isDefined(currentParams) ? mapExtractedToReviewRows(currentParams.transactions) : [];
    const originalText = currentParams?.originalText ?? '';
    const { rows, isSaving, canSave, editAmount, setCategory, deleteRow, saveAll } = useVoiceReview(initialRows);

    const totalAmount = sumAmounts(rows);
    const accountId = defaultAccount?.id ?? null;
    const { account: accountWithInstrument } = useGetAccountByIdQuery(accountId ?? 0);
    const currencySymbol = accountWithInstrument?.instrument.symbol ?? '';
    const canDelete = rows.length > 1;

    const handleCategoryPress = async (rowId: string, currentCategoryId: number | null) => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: currentCategoryId, variant: 'destructive' });

        if (isDefined(selectedCategoryId)) {
            setCategory(rowId, selectedCategoryId);
        }
    };

    const handleCancel = () => void resolveVoiceReview({ kind: 'cancelled' });
    const handleReRecord = () => void resolveVoiceReview({ kind: 're-record' });
    const handleSave = async () => {
        if (!isPositiveNumber(accountId)) {
            return;
        }
        const saved = await saveAll(accountId);
        if (saved === null) {
            return;
        }
        resolveVoiceReview({ kind: 'saved', transactionIds: saved.map(transaction => transaction.id) });
    };

    const containerStyle = { flex: 1, backgroundColor };
    const itemCount = rows.length;
    const description = t`Detected items: ${itemCount}`;

    return (
        <View style={containerStyle} collapsable={false}>
            <FormsheetHeader size="md" title={t`Voice import`} description={description} />

            {isNotEmptyString(originalText) ? (
                <View className="mx-lg mb-md rounded-2xl border border-secondary-corner bg-secondary-background px-lg py-md">
                    <Text className="text-xs uppercase tracking-wider text-secondary-foreground opacity-60">{t`You said`}</Text>
                    <Text className="mt-xs text-md italic text-primary" numberOfLines={3}>
                        “{originalText}”
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
                        {rows.map(row => {
                            const handleAmount = (amount: number) => void editAmount(row.id, amount);
                            const handleCategory = () => void handleCategoryPress(row.id, row.categoryId);
                            const handleDelete = () => void deleteRow(row.id);

                            return (
                                <SplitEntryRow
                                    key={row.id}
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
                isSaving={isSaving}
                onCancel={handleCancel}
                onReRecord={handleReRecord}
                onSave={handleSave}
            />
        </View>
    );
}
