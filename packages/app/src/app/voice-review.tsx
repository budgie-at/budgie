import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { VoiceReviewFooter } from '../ai/component/voice-review-footer/voice-review-footer';
import { VoiceReviewList } from '../ai/component/voice-review-list/voice-review-list';
import { useVoiceReviewModal } from '../ai/context/voice-review-modal.context';
import { useVoiceReview } from '../ai/hook/use-voice-review.hook';
import { mapExtractedToReviewRows } from '../ai/utils/map-extracted-to-review-rows.util';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../category/query/use-get-category-by-id.query';
import { useSettingsContext } from '../settings/context/settings.context';

const SCROLL_BOTTOM_PADDING = 16;
const SCROLL_CONTENT_STYLE = { paddingBottom: SCROLL_BOTTOM_PADDING } as const;

const sumMicroUnits = (rows: { readonly amountMicroUnits: number }[]): number =>
    rows.reduce((accumulator, row) => accumulator + row.amountMicroUnits, 0);

// eslint-disable-next-line max-statements -- Form-sheet route orchestrates list, category picker, save, and re-record
export default function VoiceReviewModal() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const [, resolveVoiceReview, currentParams] = useVoiceReviewModal();
    const [openCategorySelector] = useCategorySelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const initialRows = isDefined(currentParams) ? mapExtractedToReviewRows(currentParams.transactions) : [];
    const { rows, isSaving, editRow, deleteRow, saveAll } = useVoiceReview(initialRows);

    const [categoryId, setCategoryId] = useState<number | null>(null);
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);

    const totalMicroUnits = sumMicroUnits(rows);
    const accountId = defaultAccount?.id ?? null;
    const canSave = isNotEmptyArray(rows) && isPositiveNumber(categoryId) && isPositiveNumber(accountId);

    const handleCategoryPress = async () => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: categoryId, variant: 'destructive' });

        if (isDefined(selectedCategoryId)) {
            setCategoryId(selectedCategoryId);
        }
    };

    const handleCancel = () => void resolveVoiceReview('cancelled');
    const handleReRecord = () => void resolveVoiceReview('re-record');
    const handleSave = async () => {
        if (!isPositiveNumber(categoryId) || !isPositiveNumber(accountId)) {
            return;
        }
        const success = await saveAll({ accountId, categoryId });
        if (!success) {
            return;
        }
        resolveVoiceReview('saved');
    };

    const containerStyle = { flex: 1, backgroundColor };
    const categoryButtonVariant = isDefined(category) ? 'destructive' : 'secondary';
    const categoryButtonContent = isDefined(category) ? category.title : t`Pick category`;
    const description = plural(rows.length, { one: '# item detected', other: '# items detected' });

    return (
        <View style={containerStyle} collapsable={false}>
            <FormsheetHeader size="md" title={t`Voice import`} description={description} />

            <ScrollView className="flex-1" contentContainerStyle={SCROLL_CONTENT_STYLE} keyboardShouldPersistTaps="handled">
                <View className="px-lg pb-md">
                    <Button variant={categoryButtonVariant} content={categoryButtonContent} onPress={handleCategoryPress} />
                </View>

                <VoiceReviewList rows={rows} onEdit={editRow} onDelete={deleteRow} />
            </ScrollView>

            <VoiceReviewFooter
                count={rows.length}
                totalMicroUnits={totalMicroUnits}
                canSave={canSave}
                isSaving={isSaving}
                onCancel={handleCancel}
                onReRecord={handleReRecord}
                onSave={handleSave}
            />
        </View>
    );
}
