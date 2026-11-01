import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useGetAllMccCategoriesQuery } from '../../../mcc-category/query/use-get-all-mcc-categories.query';
import { formatMccDisplay } from '../../../mcc-category/utils/format-mcc-display.util';
import { useRuleMccSelectorModal } from '../../context/rule-mcc-selector-modal.context';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionMccSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { value, onChange, isMissing } = useRuleConditionValueField(index);
    const [openRuleMccSelector] = useRuleMccSelectorModal();
    const { mccCategories } = useGetAllMccCategoriesQuery();
    const selectedMcc = mccCategories.find(({ mcc }) => mcc === value);
    const fallbackLabel = isNotEmptyString(value) ? value.split(',').join(', ') : null;
    const selectedLabel = isDefined(selectedMcc) ? formatMccDisplay(selectedMcc) : fallbackLabel;

    const handleOpen = () => {
        openRuleMccSelector({ selectedMcc: value }, nextMcc => {
            if (isDefined(nextMcc)) {
                onChange(nextMcc);
            }
        });
    };

    return (
        <RuleValuePickerButton
            value={selectedLabel}
            isMissing={isMissing}
            placeholder={t`Choose a merchant category`}
            name={t`Merchant category`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
