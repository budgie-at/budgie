import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useGetAllMccCategoriesQuery } from '../../../mcc-category/query/use-get-all-mcc-categories.query';
import { formatMccDisplay } from '../../../mcc-category/utils/format-mcc-display.util';
import { useRuleMccSelectorModal } from '../../context/rule-mcc-selector-modal.context';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionMccSelectorContent = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { value, onChange } = useRuleConditionValueField(index);
    const [openRuleMccSelector] = useRuleMccSelectorModal();
    const { mccCategories, isLoading } = useGetAllMccCategoriesQuery();

    const handleOpen = async () => {
        const result = await openRuleMccSelector({ selectedMcc: value });

        if (isDefined(result)) {
            onChange(result);
        }
    };

    const selectedMcc = mccCategories.find(({ mcc }) => mcc === value);
    const displayLabel = selectedMcc ? formatMccDisplay(selectedMcc) : t`Select MCC code`;

    const content = isLoading ? <Trans>Loading...</Trans> : displayLabel;

    return (
        <HapticPressable
            testID={testID}
            onPress={handleOpen}
            className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
        >
            <Text className="text-primary text-sm" numberOfLines={1}>
                {content}
            </Text>
        </HapticPressable>
    );
};
