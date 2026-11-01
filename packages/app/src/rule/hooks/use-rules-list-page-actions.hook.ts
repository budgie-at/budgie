import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { RuleService } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useCreateAction } from '../../@generic/hook/use-create-action.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useRuleFormModal } from '../context/rule-form-modal.context';
import { useGetAllRulesQuery } from '../query/use-get-all-rules.query';
import { RulesPageSelector } from '../selector/rules-page.selector';

export const useRulesListPageActions = () => {
    const { t } = useLingui();
    const { rules } = useGetAllRulesQuery();
    const [openRuleForm] = useRuleFormModal();
    const [, , hapticSelection] = useVibration();

    const handleDeleteRule = (id: number) =>
        Effect.flatMap(RuleService, ruleService => ruleService.archiveById(id)).pipe(toastOnFailure(t`Could not delete rule`));

    const handleToggleRule = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'id'>, enabled: boolean) => {
        hapticSelection();
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
