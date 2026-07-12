import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ChromePage } from '../../../@generic/component/chrome-page/chrome-page';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useTransactionInfoMatchingRules } from '../../hook/use-transaction-info-matching-rules.hook';
import { useTransactionInfoSimilarStatsQuery } from '../../query/use-transaction-info-similar-stats.query';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionInfoAccountRows } from '../transaction-info-account-rows/transaction-info-account-rows';
import { TransactionInfoCategoryRows } from '../transaction-info-category-rows/transaction-info-category-rows';
import { TransactionInfoHero } from '../transaction-info-hero/transaction-info-hero';
import { TransactionInfoMoneyRows } from '../transaction-info-money-rows/transaction-info-money-rows';
import { TransactionInfoPageHeader } from '../transaction-info-page-header/transaction-info-page-header';
import { TransactionInfoSimilarCard } from '../transaction-info-similar-card/transaction-info-similar-card';
import { TransactionInfoSourceRows } from '../transaction-info-source-rows/transaction-info-source-rows';
import { TransactionInfoTagsSection } from '../transaction-info-tags-section/transaction-info-tags-section';

import { TransactionInfoPageSelector } from './transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Href } from 'expo-router';
import type { Edge } from 'react-native-safe-area-context';

const safeEdges: Edge[] = ['bottom', 'top'];

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly editHref: Href;
    readonly onDelete: () => Promise<void> | void;
    readonly onRevert?: () => void;
    readonly onConvertToTransfer?: () => void;
    readonly onConvertToRefund?: () => void;
    readonly onOpenRefundSources?: () => void;
    readonly onOpenConsolidationSources?: () => void;
}

const getCategoryLabel = (transaction: TransactionWithRelationsEntityInterface): string | null =>
    getTransactionCategoryEntries(transaction.entries).at(0)?.category?.title ?? null;

const hasTransferConversionRow = (transaction: TransactionWithRelationsEntityInterface): boolean => {
    const sourceEntry = transaction.entries.find(entry => entry.accountId === transaction.fromAccountId);
    const destinationEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);

    return (
        transaction.type === TransactionTypeEnum.TRANSFER &&
        isDefined(sourceEntry) &&
        isDefined(destinationEntry) &&
        sourceEntry.account.instrument.id !== destinationEntry.account.instrument.id
    );
};

const hasFeeRow = (transaction: TransactionWithRelationsEntityInterface): boolean => {
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));

    return isPositiveNumber(feeAmount);
};

const getRowVisibility = (
    transaction: TransactionWithRelationsEntityInterface,
    onOpenRefundSources: Props['onOpenRefundSources'],
    onOpenConsolidationSources: Props['onOpenConsolidationSources']
) => {
    const categoryLabel = getCategoryLabel(transaction);
    const showCategoryRow = isNotEmptyString(categoryLabel) && transaction.type !== TransactionTypeEnum.TRANSFER;
    const showMccRow = isDefined(getTransactionCategoryEntries(transaction.entries).at(0)?.mccCategory);
    const showNoteRow = isNotEmptyString(transaction.comment) && transaction.comment !== getTransactionDisplayTitle(transaction);
    const isConsolidated = isDefined(transaction.consolidationType);
    const hasCategoryRows = showCategoryRow || showMccRow || showNoteRow;
    const hasMoneyRows = hasTransferConversionRow(transaction) || hasFeeRow(transaction);
    const hasSourceRows = isConsolidated && (isDefined(onOpenConsolidationSources) || isDefined(onOpenRefundSources));
    const hasRowsAfterAccount = hasCategoryRows || hasMoneyRows || hasSourceRows;
    const hasRowsAfterCategory = hasMoneyRows || hasSourceRows;

    return {
        categoryLabel,
        isConsolidated,
        hasRowsAfterAccount,
        hasRowsAfterCategory,
        hasSourceRows
    };
};

export const TransactionInfoPage = (props: Props) => {
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
    const { stats, isLoading } = useTransactionInfoSimilarStatsQuery(transaction);
    const matchingRuleIds = useTransactionInfoMatchingRules(transaction);

    const handleEditPress = () => {
        router.push(editHref);
    };
    const handleGoBack = () => {
        router.back();
    };

    const rowVisibility = getRowVisibility(transaction, onOpenRefundSources, onOpenConsolidationSources);

    return (
        <ChromePage
            safeEdges={safeEdges}
            contentClassName="px-0"
            header={
                <TransactionInfoPageHeader
                    isConsolidated={rowVisibility.isConsolidated}
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
                        variant="ghost"
                        leftIcon={UserIconNameEnum.Pencil}
                        content={t`Edit transaction`}
                        onPress={handleEditPress}
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
                    <View>
                        <TransactionInfoAccountRows transaction={transaction} hasFollowingRows={rowVisibility.hasRowsAfterAccount} />
                        <TransactionInfoCategoryRows
                            transaction={transaction}
                            categoryLabel={rowVisibility.categoryLabel}
                            hasFollowingRows={rowVisibility.hasRowsAfterCategory}
                        />
                        <TransactionInfoMoneyRows transaction={transaction} hasFollowingRows={rowVisibility.hasSourceRows} />
                        <TransactionInfoSourceRows
                            transaction={transaction}
                            onOpenRefundSources={onOpenRefundSources}
                            onOpenConsolidationSources={onOpenConsolidationSources}
                        />
                    </View>

                    <TransactionInfoTagsSection transaction={transaction} />

                    <TransactionInfoSimilarCard stats={stats} title={t`Similar transactions`} isLoading={isLoading} />
                </View>
            </ScrollView>
        </ChromePage>
    );
};
