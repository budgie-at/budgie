import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { useGetRuleByIdQuery } from '../../query/use-get-rule-by-id.query';
import { RuleFormEditContent } from '../rule-form-edit-content/rule-form-edit-content';

import type { ModalResult } from '../../../@generic/type/modal-result.type';

interface Props {
    readonly ruleId: number;
    readonly onSuccess: (result: ModalResult<'/rule-form'> | null) => void;
    readonly onCancel: () => void;
}

export const RuleFormEdit = ({ ruleId, onSuccess, onCancel }: Props) => {
    const { rule, isLoading } = useGetRuleByIdQuery(ruleId);

    if (isLoading || !isDefined(rule)) {
        return <LoadingScreen />;
    }

    return <RuleFormEditContent rule={rule} onSuccess={onSuccess} onCancel={onCancel} />;
};
