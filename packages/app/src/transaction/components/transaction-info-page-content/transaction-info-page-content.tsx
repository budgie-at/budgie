import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { doesRuleMatchTransaction } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { useGetEnabledRulesQuery } from '../../../rule/query/use-get-enabled-rules.query';
import { useTransactionInfoHandoff } from '../../hook/use-transaction-info-handoff.hook';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
import { TransactionInfoDeleteRow } from '../transaction-info-delete-row/transaction-info-delete-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoHeader } from '../transaction-info-header/transaction-info-header';
import { TransactionInfoHero } from '../transaction-info-hero/transaction-info-hero';
import { TransactionInfoMoneyRows } from '../transaction-info-money-rows/transaction-info-money-rows';
import { TransactionInfoNavBand } from '../transaction-info-nav-band/transaction-info-nav-band';
import { TransactionInfoNoteGroup } from '../transaction-info-note-group/transaction-info-note-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRefundSummary } from '../transaction-info-refund-summary/transaction-info-refund-summary';
import { TransactionInfoScrollView } from '../transaction-info-scroll-view/transaction-info-scroll-view';
import { TransactionInfoSimilarCard } from '../transaction-info-similar-card/transaction-info-similar-card';
import { TransactionInfoSourceRows } from '../transaction-info-source-rows/transaction-info-source-rows';
import { TransactionInfoTagsSection } from '../transaction-info-tags-section/transaction-info-tags-section';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';
import type { SuggestRuleDataInterface } from '@budgie/rules';

export const TransactionInfoPageContent = ({
    transaction,
    editHref,
    actions,
    onDelete,
    onOpenRefundSources,
    onOpenConsolidationSources
}: TransactionInfoPagePropsInterface) => {
    const router = useRouter();
    const { t } = useLingui();
    const { minimumHeight, revealOffset, onEndLayout, onAmountLayout, scrollRef, handleScrollEnd } = useTransactionInfoHandoff();
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

    const handleGoBack = () => void router.back();

    return (
        <ScreenChromeFrame testID={TransactionInfoPageSelector.Page}>
            <TransactionInfoScrollView scrollRef={scrollRef} onScrollEnd={handleScrollEnd} minimumHeight={minimumHeight}>
                <View className="px-3xl">
                    <TransactionInfoHero
                        transaction={transaction}
                        matchingRuleIds={matchingRuleIds}
                        onTitleLayout={onAmountLayout}
                        onEndLayout={onEndLayout}
                    />

                    <View className="gap-y-5xl">
                        <TransactionInfoGroup>
                            <TransactionInfoAccountRows transaction={transaction} />
                            <TransactionInfoMoneyRows transaction={transaction} />
                            {transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND ? (
                                <TransactionInfoRefundSummary transaction={transaction} />
                            ) : null}
                            <TransactionInfoCategoryRows transaction={transaction} />
                            <TransactionInfoTagsSection transaction={transaction} />
                        </TransactionInfoGroup>

                        <TransactionInfoNoteGroup transaction={transaction} />

                        <TransactionInfoSourceRows
                            transaction={transaction}
                            onOpenRefundSources={onOpenRefundSources}
                            onOpenConsolidationSources={onOpenConsolidationSources}
                        />

                        <TransactionInfoSimilarCard stats={stats} title={t`Similar transactions`} isLoading={isLoading} />

                        {actions}

                        <TransactionInfoDeleteRow transaction={transaction} onDelete={onDelete} />
                    </View>
                </View>
            </TransactionInfoScrollView>

            <TransactionInfoNavBand />

            <TransactionInfoHeader transaction={transaction} editHref={editHref} revealOffset={revealOffset} onGoBack={handleGoBack} />
        </ScreenChromeFrame>
    );
};
