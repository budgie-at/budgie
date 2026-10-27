import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { RuleService } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { useCreateAction } from '../../@generic/hook/use-create-action.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useRuleFormModal } from '../context/rule-form-modal.context';
import { useGetAllRulesQuery } from '../query/use-get-all-rules.query';
import { RulesPageSelector } from '../selector/rules-page.selector';

export const useRulesListPageActions = () => {
    const { t } = useLingui();
    const { rules } = useGetAllRulesQuery();
    const [openRuleForm] = useRuleFormModal();

    const handleDeleteRule = (id: number): Promise<void> =>
        appRuntime.runPromise(
            Effect.flatMap(RuleService, ruleService => ruleService.archiveById(id)).pipe(
                Effect.tapCause(cause => Effect.logError(cause)),
                Effect.tapError(error => Effect.sync(() => void showErrorToast(t`Could not delete rule`, getErrorMessage(error))))
            )
        );

    const handleToggleRule = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'id'>, enabled: boolean) => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(RuleService, ruleService => ruleService.toggleEnabled(rule.id, enabled)).pipe(
                    toastOnFailure(t`Could not update rule`)
                )
            )
        );
    };

    const handleOpenRule = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'id'>) => {
        openRuleForm({ ruleId: rule.id });
    };

    const handleCreateRule = () => {
        openRuleForm();
    };

    useCreateAction({
        icon: UserIconNameEnum.Zap,
        label: t`Rule`,
        variant: 'primary',
        onPress: handleCreateRule,
        testID: RulesPageSelector.CreateButton
    });

    return { rules, handleDeleteRule, handleOpenRule, handleToggleRule };
};
