import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { useGetBankIntegrationCountQuery } from '../../../sync/query/use-get-bank-integration-count.query';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { RulesPageSelector } from '../../selector/rules-page.selector';

export const RulesFeatureIntro = () => {
    const { t } = useLingui();
    const bankIntegrationCount = useGetBankIntegrationCountQuery();
    const [openRuleForm] = useRuleFormModal();

    const handleCreateRule = () => {
        openRuleForm();
    };
    const handleConnectBank = () => void router.push('/create-account');

    if (!isPositiveNumber(bankIntegrationCount)) {
        return (
            <StatsEmptyCard
                testID={RulesPageSelector.EmptyState}
                icon={UserIconNameEnum.Zap}
                title={t`Rules work on imported transactions`}
                description={t`Connect a bank or import a statement first, then rules can categorise and tag every transaction as it arrives.`}
            >
                <Button onPress={handleConnectBank} leftIcon={UserIconNameEnum.Landmark} content={t`Connect a bank`} />
            </StatsEmptyCard>
        );
    }

    return (
        <StatsEmptyCard
            testID={RulesPageSelector.EmptyState}
            icon={UserIconNameEnum.Zap}
            title={t`Categorise imports automatically`}
            description={t`A rule matches incoming bank transactions and applies a category and tags for you.`}
        >
            <Button onPress={handleCreateRule} leftIcon={UserIconNameEnum.Plus} content={t`Create a rule`} />
        </StatsEmptyCard>
    );
};
