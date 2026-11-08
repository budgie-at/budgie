import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { VoiceReviewSelector } from '../../../app/voice-review.selector';
import { VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE } from '../../constant/voice-review-accessibility-font-scale.constant';
import { VoiceReviewEmptyState } from '../voice-review-empty-state/voice-review-empty-state';
import { VoiceReviewFooter } from '../voice-review-footer/voice-review-footer';
import { VoiceReviewItem } from '../voice-review-item/voice-review-item';
import { VoiceReviewSaveButton } from '../voice-review-save-button/voice-review-save-button';

import type { VoiceReviewModalResult } from '../../context/voice-review-modal.context';
import type { UseVoiceReviewReturnInterface } from '../../interface/use-voice-review-return.interface';

const SCROLL_CONTENT_STYLE = { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, flexGrow: 1 } as const;

const sumAmounts = (rows: { readonly amount: number }[]): number => rows.reduce((accumulator, row) => accumulator + row.amount, 0);

interface Props {
    readonly review: UseVoiceReviewReturnInterface;
    readonly currencySymbol: string;
    readonly originalText: string;
    readonly accountId: number | null;
    readonly onCategoryPress: (rowId: string, categoryId: number | null) => void;
    readonly onCommit: (result: VoiceReviewModalResult) => void;
}

// eslint-disable-next-line max-lines-per-function -- Step content orchestrating the review list and footer actions
export const VoiceReviewStep = (props: Props) => {
    const { review, currencySymbol, originalText, accountId, onCategoryPress, onCommit } = props;
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const sheetStyle = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const { rows, isSaving, canSave, hasInvalidAmounts, hasMissingCategories, editAmount, deleteRow, saveAll } = review;

    const totalAmount = sumAmounts(rows);
    const titleClassName = fontScale >= VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? 'text-[15px] leading-[20px]' : '';
    const canDelete = rows.length > 1;
    const canSaveToAccount = canSave && isPositiveNumber(accountId);
    const transcript = isNotEmptyString(originalText) ? (
        <View className="mt-xl px-xl py-lg">
            <Text className="text-md leading-relaxed text-secondary-foreground" selectable>
                {originalText}
            </Text>
        </View>
    ) : null;

    const handleCancel = () => void commit({ kind: 'cancelled' });
    const handleReRecord = () => void commit({ kind: 're-record' });

    const handleSave = () => {
        if (!isPositiveNumber(accountId)) {
            return;
        }

        appRuntime.runFork(
            saveAll(accountId).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        if (isDefined(result)) {
                            commit({
                                kind: 'saved',
                                transactionIds: result.transactions.map(transaction => transaction.id),
                                accountId: result.destinationAccountId
                            });
                        }
                    })
                )
            )
        );
    };

    return (
        <View style={sheetStyle}>
            <SheetSurface className="pt-lg">
                <View className="flex-1" testID={VoiceReviewSelector.Page} collapsable={false}>
                    <SheetTitle title={t`Voice notes`} className={titleClassName} maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} />
                    {isEmptyArray(rows) ? (
                        <VoiceReviewEmptyState>{transcript}</VoiceReviewEmptyState>
                    ) : (
                        <KeyboardAwareScrollView
                            className="flex-1"
                            contentContainerStyle={SCROLL_CONTENT_STYLE}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            bottomOffset={24}
                        >
                            <GroupedListSection>
                                {rows.map((row, index) => (
                                    <VoiceReviewItem
                                        key={row.id}
                                        row={row}
                                        index={index}
                                        currencySymbol={currencySymbol}
                                        canDelete={canDelete}
                                        disabled={isSaving}
                                        onAmountChange={editAmount}
                                        onCategoryPress={onCategoryPress}
                                        onDelete={deleteRow}
                                    />
                                ))}
                            </GroupedListSection>
                            {transcript}
                        </KeyboardAwareScrollView>
                    )}

                    <VoiceReviewFooter
                        count={rows.length}
                        isSaving={isSaving}
                        totalAmount={totalAmount}
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
