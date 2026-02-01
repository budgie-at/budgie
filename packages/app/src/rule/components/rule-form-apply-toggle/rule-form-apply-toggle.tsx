import { RuleCreateInputInterface } from '@budgie/contracts';
import { useController, useFormContext } from 'react-hook-form';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { RuleApplyToExistingToggle } from '../rule-apply-to-existing-toggle/rule-apply-to-existing-toggle';

export const RuleFormApplyToggle = () => {
    const { control } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'applyToExisting' });

    return <RuleApplyToExistingToggle testID={RuleFormSelectors.ApplyToggle} value={value} onChange={onChange} />;
};
