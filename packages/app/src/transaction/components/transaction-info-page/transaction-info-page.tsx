import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FullPage } from '../../../@generic/component/page/full-page';
import { TransactionInfoSimilarPeriodEnum } from '../../enum/transaction-info-similar-period.enum';
import { useTransactionInfoMatchingRules } from '../../hook/use-transaction-info-matching-rules.hook';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
import { TransactionInfoHero } from '../transaction-info-hero/transaction-info-hero';
import { TransactionInfoMoneyRows } from '../transaction-info-money-rows/transaction-info-money-rows';
import { TransactionInfoPageHeader } from '../transaction-info-page-header/transaction-info-page-header';
import { TransactionInfoSimilarCard } from '../transaction-info-similar-card/transaction-info-similar-card';
import { TransactionInfoSourceRows } from '../transaction-info-source-rows/transaction-info-source-rows';

import { TransactionInfoPageSelector } from './transaction-info-page.selector';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const getCategoryLabel = (transaction: TransactionWithRelationsEntityInterface): string | null =>
    getTransactionCategoryEntries(transaction.entries).at(0)?.category?.title ?? null;

export const TransactionInfoPage = (props: TransactionInfoPagePropsInterface) => {
    const {
        transaction,
        editHref,
        onDelete,
        onRevert,
        onConvertToTransfer,
        onConvertToRefund,
        onOpenRefundSources,
        onOpenConsolidationSources
    } = props;
    const router = useRouter();
    const { t } = useLingui();
    const [similarPeriod, setSimilarPeriod] = useState(TransactionInfoSimilarPeriodEnum.SIX_MONTHS);
    const { stats, isLoading } = useTransactionInfoSimilarStatsQuery(transaction, similarPeriod);
    const matchingRuleIds = useTransactionInfoMatchingRules(transaction);
    const categoryLabel = getCategoryLabel(transaction);
    const isConsolidated = isDefined(transaction.consolidationType);

    const handleEditPress = () => {
        router.push(editHref);
    };
    const handleGoBack = () => {
        router.back();
    };

    return (
        <FullPage
            withBlur
            contentClassName="px-0"
            header={
                <TransactionInfoPageHeader
                    isConsolidated={isConsolidated}
                    onGoBack={handleGoBack}
                    onDelete={onDelete}
                    onRevert={onRevert}
                    onConvertToRefund={onConvertToRefund}
                    onConvertToTransfer={onConvertToTransfer}
                />
            }
            footer={
                <View className="px-5xl pb-md pt-lg">
                    <Button
                        variant="primary"
                        leftIcon={UserIconNameEnum.Pencil}
                        content={t`Edit transaction`}
                        onPress={handleEditPress}
                        testID={TransactionInfoPageSelector.EditButton}
                    />
                </View>
            }
            testID={TransactionInfoPageSelector.Page}
        >
            <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="px-5xl pb-8xl">
                <TransactionInfoHero
                    transaction={transaction}
                    categoryLabel={categoryLabel}
                    matchingRuleIds={matchingRuleIds}
                    onOpenRefundSources={onOpenRefundSources}
                />

                <View className="gap-y-2xl">
                    <View>
                        <TransactionInfoAccountRows transaction={transaction} />
                        <TransactionInfoCategoryRows transaction={transaction} categoryLabel={categoryLabel} />
                        <TransactionInfoMoneyRows transaction={transaction} />
                        <TransactionInfoSourceRows transaction={transaction} onOpenConsolidationSources={onOpenConsolidationSources} />
                    </View>

                    <TransactionInfoSimilarCard
                        stats={stats}
                        period={similarPeriod}
                        title={t`Similar transactions`}
                        isLoading={isLoading}
                        onPeriodChange={setSimilarPeriod}
                    />
                </View>
            </ScrollView>
        </FullPage>
    );
};
