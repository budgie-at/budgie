import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { doesRuleMatchTransaction } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyArray } from '@rnw-community/shared';

import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useGetEnabledRulesQuery } from '../../../rule/query/use-get-enabled-rules.query';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useTransactionInfoHandoff } from '../../hook/use-transaction-info-handoff.hook';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoActionsGroup } from '../transaction-info-actions-group/transaction-info-actions-group';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
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
import { TransactionInfoTagsSection } from '../transaction-info-tags-section/transaction-info-tags-section';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';
import type { SuggestRuleDataInterface } from '@budgie/rules';

export const TransactionInfoPageContent = ({
    transaction,
    editHref,
    actionItems,
    onDelete,
    onFeePress,
    onOpenRefundSources,
    onOpenConsolidationSources
}: TransactionInfoPagePropsInterface) => {
    const router = useRouter();
    const { t } = useLingui();
    const { minimumHeight, handoff, onAmountLayout, onTitleLayout, onBodyLayout, onContentLayout, scrollRef, handleScrollEnd } =
        useTransactionInfoHandoff();
    const undoRefund = useRevertConsolidation(transaction.id, () => void dismissAllOrReplace('/'), true);
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

    const pageActionItems = isNotEmptyArray(getTransactionFeeEntries(transaction.entries))
        ? actionItems.filter(item => item.testID !== TransactionActionsMenuSelector.FeeButton)
        : actionItems;
    const isRefundPurchase = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const handleGoBack = () => void router.back();
    const handleDestructiveAction = isRefundPurchase ? undoRefund : onDelete;

    return (
        <ScreenChromeFrame testID={TransactionInfoPageSelector.Page}>
            <TransactionInfoScrollView scrollRef={scrollRef} onScrollEnd={handleScrollEnd} minimumHeight={minimumHeight}>
                <View className="px-3xl" onLayout={onContentLayout}>
                    <TransactionInfoHero
                        transaction={transaction}
                        matchingRuleIds={matchingRuleIds}
                        onAmountLayout={onAmountLayout}
                        onTitleLayout={onTitleLayout}
                    />

                    <View className="gap-y-5xl" onLayout={onBodyLayout}>
                        <TransactionInfoGroup>
                            <TransactionInfoAccountRows transaction={transaction} />
                            <TransactionInfoMoneyRows transaction={transaction} onFeePress={onFeePress} />
                            {isRefundPurchase ? <TransactionInfoRefundSummary transaction={transaction} /> : null}
                            <TransactionInfoCategoryRows transaction={transaction} />
                            <TransactionInfoTagsSection transaction={transaction} />
                        </TransactionInfoGroup>

                        <TransactionInfoNoteGroup
                            transaction={transaction}
                            onOpenSources={onOpenConsolidationSources ?? onOpenRefundSources}
                        />

                        <TransactionInfoSimilarCard stats={stats} title={t`Similar transactions`} isLoading={isLoading} />

                        <TransactionInfoActionsGroup transaction={transaction} items={pageActionItems} onDelete={handleDestructiveAction} />
                    </View>
                </View>
            </TransactionInfoScrollView>

            <TransactionInfoNavBand />

            <TransactionInfoHeader transaction={transaction} editHref={editHref} handoff={handoff} onGoBack={handleGoBack} />
        </ScreenChromeFrame>
    );
};
