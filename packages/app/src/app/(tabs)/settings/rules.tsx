import { RuleEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { AnimatedFlatList } from '../../../@generic/component/animated-flat-list/animated-flat-list';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { IdInterface } from '../../../@generic/interface/id.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { RuleCard } from '../../../rule/components/rule-card/rule-card';
import { useGetAllRulesQuery } from '../../../rule/query/use-get-all-rules.query';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';

type RuleWithRelationsType = ComponentProps<typeof RuleCard>['rule'];

const keyExtractor = (item: IdInterface) => item.id.toString();
const safeEdges = ['bottom'] as const;
const listFooter = <SafeAreaView edges={safeEdges} />;
const handleGoBack = () => void goBackOrReplace('/settings');

export default function RulesPage() {
    const { t } = useLingui();
    const { rules } = useGetAllRulesQuery();
    const [notify] = useVibration();

    const handleDeleteRule = async (id: number) => {
        await ruleRepository.deleteById(id);
        notify(NotificationFeedbackType.Success);
    };

    const handleOpenRule = (rule: RuleEntityInterface) => void router.push(`/rules/${rule.id}/edit`);
    const handleCreateRule = () => void router.push('/rules/create');

    useCreateAction({
        icon: UserIconNameEnum.Zap,
        label: t`Rule`,
        variant: 'primary',
        onPress: handleCreateRule
    });

    const renderItem = (rule: RuleWithRelationsType, index: number) => {
        const order = index + 1;

        return (
            <DeletableRow
                deleteConfirmTitle={t`Delete Rule`}
                deleteConfirmDescription={t`Are you sure you want to delete this rule? This action cannot be undone.`}
                id={rule.id}
                onDelete={handleDeleteRule}
            >
                <RuleCard onOpen={handleOpenRule} order={order} rule={rule} />
            </DeletableRow>
        );
    };

    return (
        <Page header={<PageHeader onGoBack={handleGoBack} title={t`Rules`} />}>
            {isNotEmptyArray(rules) ? (
                <AnimatedFlatList
                    className="flex-1"
                    data={rules}
                    contentContainerClassName="gap-y-5xl"
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <SearchablePageEmptyState
                    title={t`No Rules Yet`}
                    icon={UserIconNameEnum.Zap}
                    description={t`Create rules to automatically categorize and tag your bank transactions`}
                />
            )}
        </Page>
    );
}
