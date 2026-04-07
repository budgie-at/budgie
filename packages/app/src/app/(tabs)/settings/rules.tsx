import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactElement } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { RuleCardSelectors, RulesPageSelectors } from '../../../@e2e/selectors/rule-page.selector';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import {
    LEGEND_LIST_CONTENT_GAP,
    LEGEND_LIST_ESTIMATED_ITEM_SIZE,
    LEGEND_LIST_HEADER_HEIGHT,
    LEGEND_LIST_STYLE
} from '../../../@generic/constant/legend-list.constant';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { RuleCard } from '../../../rule/components/rule-card/rule-card';
import { useRuleFormModal } from '../../../rule/context/rule-form-modal.context';
import { useGetAllRulesQuery } from '../../../rule/query/use-get-all-rules.query';
import { ruleService } from '../../../rule/service/rule.service';

const CONTENT_CONTAINER_STYLE = { gap: LEGEND_LIST_CONTENT_GAP };
const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };

const listHeader = <View style={HEADER_SPACER_STYLE} />;
const listFooter = <MenuSpacer />;
const handleGoBack = () => void goBackOrReplace('/settings');
const getKeyExtractor = (item: Pick<RuleWithActionsRelationsEntityInterface, 'id'>) => item.id.toString();

export default function RulesPage() {
    const { t } = useLingui();
    const { rules } = useGetAllRulesQuery();
    const [notify] = useVibration();
    const { openRuleForm } = useRuleFormModal();

    const handleDeleteRule = async (id: number) => {
        await ruleService.archiveById(id);
        notify(NotificationFeedbackType.Success);
    };

    const handleOpenRule = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'id'>) => void openRuleForm({ ruleId: rule.id });
    const handleCreateRule = () => void openRuleForm();

    useCreateAction({
        icon: UserIconNameEnum.Zap,
        label: t`Rule`,
        variant: 'primary',
        onPress: handleCreateRule,
        testID: RulesPageSelectors.CreateButton
    });

    const renderItem = ({ item, index }: { item: RuleWithActionsRelationsEntityInterface; index: number }): ReactElement => {
        const order = index + 1;

        return (
            <DeletableRow id={item.id} onDelete={handleDeleteRule}>
                <RuleCard
                    testID={RuleCardSelectors.Card(index)}
                    switchTestID={RuleCardSelectors.EnabledSwitch(index)}
                    orderBadgeTestID={RuleCardSelectors.OrderBadge(index)}
                    conditionsTestID={RuleCardSelectors.ConditionsText(index)}
                    actionsTestID={RuleCardSelectors.ActionsText(index)}
                    onOpen={handleOpenRule}
                    order={order}
                    rule={item}
                />
            </DeletableRow>
        );
    };

    return (
        <Page testID={RulesPageSelectors.Page} header={<PageHeader onGoBack={handleGoBack} title={t`Rules`} />} withBlur>
            {isNotEmptyArray(rules) ? (
                <LegendList
                    style={LEGEND_LIST_STYLE}
                    contentContainerStyle={CONTENT_CONTAINER_STYLE}
                    ListHeaderComponent={listHeader}
                    data={rules}
                    renderItem={renderItem}
                    keyExtractor={getKeyExtractor}
                    estimatedItemSize={LEGEND_LIST_ESTIMATED_ITEM_SIZE}
                    recycleItems
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <SearchablePageEmptyState
                    testID={RulesPageSelectors.EmptyState}
                    title={t`No Rules Yet`}
                    icon={UserIconNameEnum.Zap}
                    description={t`Create rules to automatically categorize and tag your bank transactions`}
                />
            )}
        </Page>
    );
}
