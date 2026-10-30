import { TransactionTypeEnum } from '@budgie/contracts';
import { doesRuleMatchTransaction } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeHeader, ScreenChromeScrollView, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { useGetEnabledRulesQuery } from '../../../rule/query/use-get-enabled-rules.query';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
import { TransactionInfoDeleteRow } from '../transaction-info-delete-row/transaction-info-delete-row';
import { TransactionInfoEditButton } from '../transaction-info-edit-button/transaction-info-edit-button';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoHero } from '../transaction-info-hero/transaction-info-hero';
import { TransactionInfoMoneyRows } from '../transaction-info-money-rows/transaction-info-money-rows';
import { TransactionInfoNavBand } from '../transaction-info-nav-band/transaction-info-nav-band';
import { TransactionInfoNavTitle } from '../transaction-info-nav-title/transaction-info-nav-title';
import { TransactionInfoNoteGroup } from '../transaction-info-note-group/transaction-info-note-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoSimilarCard } from '../transaction-info-similar-card/transaction-info-similar-card';
import { TransactionInfoSourceRows } from '../transaction-info-source-rows/transaction-info-source-rows';
import { TransactionInfoTagsSection } from '../transaction-info-tags-section/transaction-info-tags-section';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';
import type { SuggestRuleDataInterface } from '@budgie/rules';
import type { LayoutChangeEvent } from 'react-native';

const HERO_TITLE_DEFAULT_OFFSET = 144;

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
    const [titleRevealOffset, setTitleRevealOffset] = useState(HERO_TITLE_DEFAULT_OFFSET);
    const { stats, isLoading } = useTransactionInfoSimilarStatsQuery(transaction);
    const { enabledRules } = useGetEnabledRulesQuery();
    const { config } = useScreenChrome();
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
    const handleHeroTitleLayout = (event: LayoutChangeEvent) =>
        void setTitleRevealOffset(event.nativeEvent.layout.y + event.nativeEvent.layout.height);

    return (
        <ScreenChromeFrame testID={TransactionInfoPageSelector.Page}>
            <ScreenChromeScrollView contentInsetTop={config.headerHeight} contentInsetBottom={32} showsVerticalScrollIndicator={false}>
                <View className="px-3xl">
                    <TransactionInfoHero
                        transaction={transaction}
                        matchingRuleIds={matchingRuleIds}
                        onOpenRefundSources={onOpenRefundSources}
                        onTitleLayout={handleHeroTitleLayout}
                    />

                    <View className="gap-y-5xl">
                        <TransactionInfoGroup>
                            <TransactionInfoAccountRows transaction={transaction} />
                            <TransactionInfoMoneyRows transaction={transaction} />
                        </TransactionInfoGroup>

                        <TransactionInfoCategoryRows transaction={transaction} />

                        <TransactionInfoNoteGroup transaction={transaction} />

                        <TransactionInfoSourceRows
                            transaction={transaction}
                            onOpenRefundSources={onOpenRefundSources}
                            onOpenConsolidationSources={onOpenConsolidationSources}
                        />

                        <TransactionInfoTagsSection transaction={transaction} />

                        <TransactionInfoSimilarCard stats={stats} title={t`Similar transactions`} isLoading={isLoading} />

                        {actions}

                        <TransactionInfoDeleteRow transaction={transaction} onDelete={onDelete} />
                    </View>
                </View>
            </ScreenChromeScrollView>

            <TransactionInfoNavBand />

            <TransactionInfoNavTitle transaction={transaction} revealOffset={titleRevealOffset} />

            <ScreenChromeHeader>
                <GoBackButton onPress={handleGoBack} />
                <TransactionInfoEditButton editHref={editHref} />
            </ScreenChromeHeader>
        </ScreenChromeFrame>
    );
};
