import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { useCreateAction } from '../../@generic/hook/use-create-action.hook';
import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { useRuleFormModal } from '../context/rule-form-modal.context';
import { useGetAllRulesQuery } from '../query/use-get-all-rules.query';
import { RulesPageSelector } from '../selector/rules-page.selector';
import { ruleService } from '../service/rule.service';

export const useRulesListPageActions = () => {
    const { t } = useLingui();
    const [rulesRefreshKey, setRulesRefreshKey] = useState(0);
    const focusKey = useFocusKey();
    const { rules } = useGetAllRulesQuery(rulesRefreshKey + focusKey);
    const { openRuleForm } = useRuleFormModal();

    const refreshRules = () => {
        setRulesRefreshKey(value => value + 1);
    };

    const handleRuleFormResult = (result: Awaited<ReturnType<typeof openRuleForm>>) => {
        if (isDefined(result)) {
            refreshRules();
        }
    };

    const handleDeleteRule = async (id: number) => {
        await ruleService.archiveById(id);
        refreshRules();
    };

    const handleToggleRule = async (rule: Pick<RuleWithActionsRelationsEntityInterface, 'id'>, enabled: boolean) => {
        try {
            await ruleService.toggleEnabled(rule.id, enabled);
            refreshRules();
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not update rule`, text2: getErrorMessage(error) });
        }
    };

    const handleOpenRule = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'id'>) =>
        void openRuleForm({ ruleId: rule.id }).then(handleRuleFormResult);

    const handleCreateRule = () => void openRuleForm().then(handleRuleFormResult);

    useCreateAction({
        icon: UserIconNameEnum.Zap,
        label: t`Rule`,
        variant: 'primary',
        onPress: handleCreateRule,
        testID: RulesPageSelector.CreateButton
    });

    return { rules, handleDeleteRule, handleOpenRule, handleToggleRule };
};
