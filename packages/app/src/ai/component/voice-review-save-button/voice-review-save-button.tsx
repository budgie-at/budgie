import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { VoiceReviewFooterSelector } from '../voice-review-footer/voice-review-footer.selector';

interface Props {
    readonly count: number;
    readonly canSave: boolean;
    readonly hasInvalidAmounts: boolean;
    readonly hasMissingCategories: boolean;
    readonly isSaving: boolean;
    readonly onSave: () => void;
}

export const VoiceReviewSaveButton = ({ count, canSave, hasInvalidAmounts, hasMissingCategories, isSaving, onSave }: Props) => {
    const { t } = useLingui();
    const validSaveLabel = t`Save ${count}`;
    const amountAwareSaveLabel = hasInvalidAmounts ? t`Enter all amounts` : validSaveLabel;
    const saveLabel = hasMissingCategories ? t`Select all categories` : amountAwareSaveLabel;
    const saveVariant: ColorPaletteVariant = canSave ? 'cta' : 'secondary';
    const isSaveDisabled = !canSave || isSaving;

    return (
        <Button
            variant={saveVariant}
            content={saveLabel}
            onPress={onSave}
            disabled={isSaveDisabled}
            isLoading={isSaving}
            testID={VoiceReviewFooterSelector.SaveButton}
        />
    );
};
