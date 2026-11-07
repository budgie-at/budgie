import { AITransactionInterface } from '@budgie/ai';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Stack } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { SheetTitle } from '../@generic/component/sheet-title/sheet-title';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { formSheetOptions } from '../@generic/utils/form-sheet-options.util';
import { useGetAccountByIdQuery } from '../account/query/use-get-account-by-id.query';
import { VoiceReviewFooter } from '../ai/component/voice-review-footer/voice-review-footer';
import { VoiceReviewItem } from '../ai/component/voice-review-item/voice-review-item';
import { VoiceReviewSaveButton } from '../ai/component/voice-review-save-button/voice-review-save-button';
import { VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE } from '../ai/constant/voice-review-accessibility-font-scale.constant';
import { useVoiceReviewModal, useVoiceReviewModalParams } from '../ai/context/voice-review-modal.context';
import { useVoiceReview } from '../ai/hook/use-voice-review.hook';
import { VoiceReviewRowInterface } from '../ai/interface/voice-review-row.interface';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { defaultAccountAtom } from '../settings/constants/settings-atoms.constant';

import { VoiceReviewSelector } from './voice-review.selector';

const EMPTY_SHEET_DETENT = 0.45;
const EXPANDED_SHEET_DETENT = 0.95;
const SCROLL_CONTENT_STYLE = { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, flexGrow: 1 } as const;

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
    const { fontScale } = useWindowDimensions();
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const [, resolveVoiceReview, dismissVoiceReview] = useVoiceReviewModal();
    useModalDismiss(dismissVoiceReview);
    const currentParams = useVoiceReviewModalParams();
    const [openCategorySelector] = useCategorySelectorModal();

    const initialRows = isDefined(currentParams) ? mapExtractedToReviewRows(currentParams.transactions) : [];
    const originalText = currentParams?.originalText ?? '';
    const { rows, isSaving, canSave, hasInvalidAmounts, hasMissingCategories, editAmount, setCategory, deleteRow, saveAll } =
        useVoiceReview(initialRows);

    const totalAmount = sumAmounts(rows);
    const accountId = defaultAccount?.id ?? null;
    const { account: accountWithInstrument } = useGetAccountByIdQuery(accountId ?? 0);
    const currencySymbol = accountWithInstrument?.instrument.symbol ?? '';
    const screenOptions = formSheetOptions(
        isEmptyArray(rows) ? [EMPTY_SHEET_DETENT, EXPANDED_SHEET_DETENT] : [0.65, EXPANDED_SHEET_DETENT],
        fontScale >= VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? 1 : 0
    );
    const titleClassName = fontScale >= VOICE_REVIEW_ACCESSIBILITY_FONT_SCALE ? 'text-[15px] leading-[20px]' : '';
    const canDelete = rows.length > 1;
    const canSaveToAccount = canSave && isPositiveNumber(accountId);

    const handleCategoryPress = (rowId: string, currentCategoryId: number | null) => {
        const excludeCategoryIds = rows
            .filter(row => row.id !== rowId)
            .map(row => row.categoryId)
            .filter(isPositiveNumber);
        openCategorySelector(
            {
                initialCategoryId: currentCategoryId,
                excludeCategoryIds,
                variant: 'destructive'
            },
            selectedCategoryId => {
                if (isDefined(selectedCategoryId)) {
                    setCategory(rowId, selectedCategoryId);
                }
            }
        );
    };

    const handleCancel = () => void resolveVoiceReview({ kind: 'cancelled' });
    const handleReRecord = () => void resolveVoiceReview({ kind: 're-record' });

    const handleUnmount = useEffectEvent(() => void resolveVoiceReview({ kind: 're-record' }, { skipBack: true }));

    useEffect(() => () => void handleUnmount(), []);
    const handleSave = () => {
        if (!isPositiveNumber(accountId)) {
            return;
        }
        appRuntime.runFork(
            saveAll(accountId).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        if (isDefined(result)) {
                            resolveVoiceReview({
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
        <SheetSurface>
            <Stack.Screen options={screenOptions} />
            <View className="flex-1" testID={VoiceReviewSelector.Page} collapsable={false}>
                <SheetTitle title={t`Voice notes`} className={titleClassName} />
                <KeyboardAwareScrollView
                    className="flex-1"
                    contentContainerStyle={SCROLL_CONTENT_STYLE}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    bottomOffset={24}
                >
                    {isEmptyArray(rows) ? (
                        <View className="flex-1 justify-center items-center gap-y-md px-xl py-3xl">
                            <Text className="text-xl leading-[24px] font-semibold text-primary text-center">{t`No items to save`}</Text>
                            <Text className="text-md text-secondary-foreground text-center">{t`Tap re-record to try again`}</Text>
                        </View>
                    ) : (
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
                                    onCategoryPress={handleCategoryPress}
                                    onDelete={deleteRow}
                                />
                            ))}
                        </GroupedListSection>
                    )}
                    {isNotEmptyString(originalText) ? (
                        <View className="mt-xl px-xl py-lg">
                            <Text className="text-md leading-relaxed text-secondary-foreground" selectable>
                                {originalText}
                            </Text>
                        </View>
                    ) : null}
                </KeyboardAwareScrollView>

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
    );
}
