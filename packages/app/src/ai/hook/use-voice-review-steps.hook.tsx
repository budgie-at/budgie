import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MorphingSheetPresentationEnum } from '../../@generic/enum/morphing-sheet-presentation.enum';
import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { defaultAccountAtom } from '../../settings/constants/settings-atoms.constant';
import { useTransactionCategorySteps } from '../../transaction/hook/use-transaction-category-steps.hook';
import { VoiceReviewStep } from '../component/voice-review-step/voice-review-step';
import { VoiceReviewStepEnum } from '../enum/voice-review-step.enum';

import { useVoiceReviewStepNavigation } from './use-voice-review-step-navigation.hook';

import type { VoiceReviewStepsConfigInterface } from '../interface/voice-review-steps-config.interface';

export const useVoiceReviewSteps = (config: VoiceReviewStepsConfigInterface) => {
    const { review, originalText, onCommit } = config;
    const { rows, setCategory } = review;
    const navigation = useVoiceReviewStepNavigation(setCategory);
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const accountId = defaultAccount?.id ?? null;
    const { account: accountWithInstrument } = useGetAccountByIdQuery(accountId ?? 0);
    const currencySymbol = accountWithInstrument?.instrument.symbol ?? '';
    const editingRow = rows.find(row => row.id === navigation.editingRowId);

    const categorySteps = useTransactionCategorySteps({
        variant: 'destructive',
        initialCategoryId: editingRow?.categoryId ?? null,
        excludeCategoryIds: rows
            .filter(row => row.id !== navigation.editingRowId)
            .map(row => row.categoryId)
            .filter(isPositiveNumber),
        ...(isDefined(accountWithInstrument) && { syncZone: accountWithInstrument.syncZone }),
        onSelect: navigation.handleCategorySelect,
        onBack: navigation.handleShowReview,
        onShowCategory: navigation.handleShowCategory,
        onShowCreate: navigation.handleShowCreate
    });

    const steps = {
        [VoiceReviewStepEnum.REVIEW]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <VoiceReviewStep
                    review={review}
                    currencySymbol={currencySymbol}
                    originalText={originalText}
                    accountId={accountId}
                    onCategoryPress={navigation.handleCategoryPress}
                    onCommit={onCommit}
                />
            )
        },
        [VoiceReviewStepEnum.CATEGORY]: categorySteps.category,
        [VoiceReviewStepEnum.CREATE_CATEGORY]: categorySteps.createCategory
    };

    return { step: navigation.step, steps, isReviewStep: navigation.step === VoiceReviewStepEnum.REVIEW };
};
