import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useGetRuleByIdQuery } from '../../query/use-get-rule-by-id.query';
import { RuleFormEditContent } from '../rule-form-edit-content/rule-form-edit-content';

interface Props {
    readonly ruleId: number;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormEdit = ({ ruleId, onSuccess, onCancel }: Props) => {
    const { rule, isLoading } = useGetRuleByIdQuery(ruleId);

    if (isLoading || !isDefined(rule)) {
        return <LoadingScreen />;
    }

    return <RuleFormEditContent rule={rule} onSuccess={onSuccess} onCancel={onCancel} />;
};
