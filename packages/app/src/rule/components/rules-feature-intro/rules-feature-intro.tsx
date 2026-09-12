import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { FeatureIntro } from '../../../@generic/component/feature-intro/feature-intro';
import { useGetBankIntegrationCountQuery } from '../../../sync/query/use-get-bank-integration-count.query';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { RulesPageSelector } from '../../selector/rules-page.selector';

export const RulesFeatureIntro = () => {
    const { t } = useLingui();
    const bankIntegrationCount = useGetBankIntegrationCountQuery();
    const { openRuleForm } = useRuleFormModal();

    const handleCreateRule = () => void openRuleForm();
    const handleConnectBank = () => void router.push('/create-account');

    if (!isPositiveNumber(bankIntegrationCount)) {
        return (
            <FeatureIntro
                testID={RulesPageSelector.EmptyState}
                icon={UserIconNameEnum.Zap}
                title={t`Rules work on imported transactions`}
                description={t`Connect a bank or import a statement first, then rules can categorise and tag every transaction as it arrives.`}
                buttonText={t`Connect a bank`}
                onCreate={handleConnectBank}
            />
        );
    }

    return (
        <FeatureIntro
            testID={RulesPageSelector.EmptyState}
            icon={UserIconNameEnum.Zap}
            title={t`Categorise imports automatically`}
            description={t`A rule matches incoming bank transactions and applies a category and tags for you.`}
            buttonText={t`Create a rule`}
            onCreate={handleCreateRule}
        />
    );
};
