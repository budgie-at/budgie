import { useLingui } from '@lingui/react/macro';
import { View, useWindowDimensions } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { VoiceReviewSelector } from '../../../app/voice-review.selector';
import { sumEntryAmounts } from '../../../transaction/utils/sum-entry-amounts.util';
import { VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE } from '../../constant/voice-review-accessibility-font-scale.constant';
import { useVoiceReviewActions } from '../../hook/use-voice-review-actions.hook';
import { VoiceReviewFooter } from '../voice-review-footer/voice-review-footer';
import { VoiceReviewList } from '../voice-review-list/voice-review-list';
import { VoiceReviewSaveButton } from '../voice-review-save-button/voice-review-save-button';

import type { ModalResult } from '../../../@generic/type/modal-result.type';
import type { UseVoiceReviewReturnInterface } from '../../interface/use-voice-review-return.interface';

interface Props {
    readonly review: UseVoiceReviewReturnInterface;
    readonly currencySymbol: string;
    readonly originalText: string;
    readonly accountId: number | null;
    readonly onCategoryPress: (rowId: string, categoryId: number | null) => void;
    readonly onCommit: (result: ModalResult<'/voice-review'>) => void;
}

export const VoiceReviewStep = (props: Props) => {
    const { review, currencySymbol, originalText, accountId, onCategoryPress, onCommit } = props;
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const sheetStyle = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const { rows, isSaving, canSave, hasInvalidAmounts, hasMissingCategories, saveAll } = review;
    const { handleCancel, handleReRecord, handleSave } = useVoiceReviewActions(saveAll, accountId, onCommit);
    const canSaveToAccount = canSave && isPositiveNumber(accountId);
    const titleClassName = fontScale >= VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? 'text-[15px] leading-[20px]' : '';

    return (
        <View style={sheetStyle}>
            <SheetSurface className="pt-lg">
                <View className="z-30 flex-1" testID={VoiceReviewSelector.Page} collapsable={false}>
                    <SheetTitle title={t`Voice notes`} className={titleClassName} maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} />
                    <VoiceReviewList
                        review={review}
                        currencySymbol={currencySymbol}
                        originalText={originalText}
                        onCategoryPress={onCategoryPress}
                    />
                    <VoiceReviewFooter
                        count={rows.length}
                        isSaving={isSaving}
                        totalAmount={sumEntryAmounts(rows)}
                        currencySymbol={currencySymbol}
                        onCancel={handleCancel}
                        onReRecord={handleReRecord}
                    >
                        <VoiceReviewSaveButton
                            count={rows.length}
                            canSave={canSaveToAccount}
                            hasInvalidAmounts={hasInvalidAmounts}
                            hasMissingCategories={hasMissingCategories}
                            isSaving={isSaving}
                            onSave={handleSave}
                        />
                    </VoiceReviewFooter>
                </View>
            </SheetSurface>
        </View>
    );
};
