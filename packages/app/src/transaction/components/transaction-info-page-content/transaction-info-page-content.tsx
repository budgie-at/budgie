import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { doesRuleMatchTransaction } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
    EdgeFade,
    ScreenChromeFooter,
    ScreenChromeFrame,
    ScreenChromeHeader,
    ScreenChromeScrollView,
    useBottomChromeInset,
    useScreenChrome
} from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { useGetEnabledRulesQuery } from '../../../rule/query/use-get-enabled-rules.query';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
import { TransactionInfoHero } from '../transaction-info-hero/transaction-info-hero';
import { TransactionInfoMoneyRows } from '../transaction-info-money-rows/transaction-info-money-rows';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoSimilarCard } from '../transaction-info-similar-card/transaction-info-similar-card';
import { TransactionInfoSourceRows } from '../transaction-info-source-rows/transaction-info-source-rows';
import { TransactionInfoTagsSection } from '../transaction-info-tags-section/transaction-info-tags-section';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';
import type { SuggestRuleDataInterface } from '@budgie/rules';
import type { EdgeFadePropsInterface } from '@rnw-community/react-native-screen-chrome';

const FOOTER_CONTENT_CLEARANCE = 140;
const FOOTER_EDGE_FADE_PROPS = { blurMethod: 'dimezisBlurView' } satisfies Omit<EdgeFadePropsInterface, 'position'>;

export const TransactionInfoPageContent = ({
    transaction,
    editHref,
    actionsMenu,
    onOpenRefundSources,
    onOpenConsolidationSources
}: TransactionInfoPagePropsInterface) => {
    const router = useRouter();
    const { t } = useLingui();
    const { stats, isLoading } = useTransactionInfoSimilarStatsQuery(transaction);
    const { enabledRules } = useGetEnabledRulesQuery();
    const { chromeHeight } = useBottomChromeInset();
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

    const handleEditPress = () => {
        if (isDefined(editHref)) {
            router.push(editHref);
        }
    };
    const handleGoBack = () => void router.back();

    const contentInsetBottom = Math.max(chromeHeight, FOOTER_CONTENT_CLEARANCE);

    return (
        <ScreenChromeFrame testID={TransactionInfoPageSelector.Page}>
            <ScreenChromeScrollView
                contentInsetTop={config.headerHeight}
                contentInsetBottom={contentInsetBottom}
                contentContainerClassName="px-5xl"
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
            </ScreenChromeScrollView>

            <EdgeFade position="top" blurMethod="dimezisBlurView" />

            <ScreenChromeHeader>
                <GoBackButton onPress={handleGoBack} />
                {actionsMenu}
            </ScreenChromeHeader>

            <ScreenChromeFooter edgeFadeProps={FOOTER_EDGE_FADE_PROPS}>
                <View className="px-5xl pb-md pt-lg">
                    <Button
                        variant="ghost"
                        leftIcon={UserIconNameEnum.Pencil}
                        content={t`Edit transaction`}
                        onPress={handleEditPress}
                        disabled={!isDefined(editHref)}
                        testID={TransactionInfoPageSelector.EditButton}
                    />
                </View>
            </ScreenChromeFooter>
        </ScreenChromeFrame>
    );
};
