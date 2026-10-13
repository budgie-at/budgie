import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { doesRuleMatchTransaction } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ChromePage } from '../../../@generic/component/chrome-page/chrome-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useGetEnabledRulesQuery } from '../../../rule/query/use-get-enabled-rules.query';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
import { TransactionInfoHero } from '../transaction-info-hero/transaction-info-hero';
import { TransactionInfoMoneyRows } from '../transaction-info-money-rows/transaction-info-money-rows';
import { TransactionInfoSimilarCard } from '../transaction-info-similar-card/transaction-info-similar-card';
import { TransactionInfoSourceRows } from '../transaction-info-source-rows/transaction-info-source-rows';
import { TransactionInfoTagsSection } from '../transaction-info-tags-section/transaction-info-tags-section';

import { TransactionInfoPageSelector } from './transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { SuggestRuleDataInterface } from '@budgie/rules';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

const safeEdges: Edge[] = ['bottom', 'top'];

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly editHref: Href | null;
    readonly actionsMenu: ReactNode;
    readonly onOpenRefundSources?: () => void;
    readonly onOpenConsolidationSources?: () => void;
}

export const TransactionInfoPage = (props: Props) => {
    const { transaction, editHref, actionsMenu, onOpenRefundSources, onOpenConsolidationSources } = props;
    const router = useRouter();
    const { t } = useLingui();
    const { stats, isLoading } = useTransactionInfoSimilarStatsQuery(transaction);
    const { enabledRules } = useGetEnabledRulesQuery();
    const firstEntry = transaction.entries.at(0);
    const suggestRuleData: SuggestRuleDataInterface = {
        title: getTransactionDisplayTitle(transaction),
        comment: transaction.comment,
        mccCode: firstEntry?.mccCategory?.mcc ?? null,
        categoryId: firstEntry?.categoryId ?? null,
        tagIds: transaction.transactionTags.map(({ tagId }) => tagId)
    };
    const transactionInput = convertTransactionToInput(transaction);
    const matchingRuleIds =
        transaction.type === TransactionTypeEnum.ADJUSTMENT
            ? []
            : enabledRules.filter(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData)).map(rule => rule.id);

    const handleEditPress = () => {
        if (isDefined(editHref)) {
            router.push(editHref);
        }
    };
    const handleGoBack = () => {
        router.back();
    };

    const isEditDisabled = !isDefined(editHref);

    return (
        <ChromePage
            safeEdges={safeEdges}
            header={<PageHeader title="" size="md" onGoBack={handleGoBack} right={actionsMenu} />}
            footer={
                <View className="px-5xl pb-md pt-lg">
                    <Button
                        variant="ghost"
                        leftIcon={UserIconNameEnum.Pencil}
                        content={t`Edit transaction`}
                        onPress={handleEditPress}
                        disabled={isEditDisabled}
                        testID={TransactionInfoPageSelector.EditButton}
                    />
                </View>
            }
            testID={TransactionInfoPageSelector.Page}
        >
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerClassName="px-5xl pb-[140px] pt-16"
                showsVerticalScrollIndicator={false}
            >
                <TransactionInfoHero
                    transaction={transaction}
                    matchingRuleIds={matchingRuleIds}
                    onOpenRefundSources={onOpenRefundSources}
                />

                <View className="gap-y-2xl">
                    <View className="overflow-hidden">
                        <View className="-mt-px">
                            <TransactionInfoAccountRows transaction={transaction} />
                            <TransactionInfoCategoryRows transaction={transaction} />
                            <TransactionInfoMoneyRows transaction={transaction} />
                            <TransactionInfoSourceRows
                                transaction={transaction}
                                onOpenRefundSources={onOpenRefundSources}
                                onOpenConsolidationSources={onOpenConsolidationSources}
                            />
                        </View>
                    </View>

                    <TransactionInfoTagsSection transaction={transaction} />

                    <TransactionInfoSimilarCard stats={stats} title={t`Similar transactions`} isLoading={isLoading} />
                </View>
            </ScrollView>
        </ChromePage>
    );
};
