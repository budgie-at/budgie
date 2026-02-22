import { RuleCreateInputInterface } from '@budgie/contracts';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useMatchingTransactionCount } from '../../hooks/use-matching-transaction-count.hook';
import { RuleCreationProgressInterface } from '../../interface/rule-creation-progress.interface';
import { RuleMatchingCount } from '../rule-matching-count/rule-matching-count';

interface Props {
    readonly progress: RuleCreationProgressInterface | null;
}

export const RuleFormApplyToggle = ({ progress }: Props) => {
    const { control } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'applyToExisting' });

    const conditions = useWatch({ control, name: 'conditions' });
    const conditionMatchType = useWatch({ control, name: 'conditionMatchType' });

    const hasNonEmptyCondition = conditions.some(condition => isNotEmptyString(condition.value));
    const { count, isLoading } = useMatchingTransactionCount({ conditions, conditionMatchType, enabled: hasNonEmptyCondition });

    return (
        <View className="flex-row items-center justify-between gap-x-lg">
            <View className="flex-1 gap-y-xxs">
                <RuleMatchingCount count={count} isLoading={isLoading} progress={progress} />
            </View>
            <ThemedSwitch testID={RuleFormSelectors.ApplyToggle} value={value} onValueChange={onChange} />
        </View>
    );
};
