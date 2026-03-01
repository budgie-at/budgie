import type { RulePrefillDataInterface } from './rule-prefill-data.interface';
import type { RuleFormResultType } from '../context/rule-form-modal.context';
import type { RuleCreateInputInterface } from '@budgie/contracts';

export interface UseRuleFormOptionsInterface {
    readonly ruleId?: number;
    readonly defaultValues?: RuleCreateInputInterface | null;
    readonly prefillData?: RulePrefillDataInterface | null;
    readonly onSuccess?: (result: RuleFormResultType) => void;
}
