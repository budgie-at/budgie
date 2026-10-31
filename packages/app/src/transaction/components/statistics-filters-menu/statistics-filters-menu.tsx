import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { Icon } from '../../../@generic/component/icon/icon';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';
import { useTransactionAmountFilterModal } from '../../context/transaction-amount-filter-modal.context';
import { useTransactionCategoryFilterModal } from '../../context/transaction-category-filter-modal.context';
import { useTransactionTagFilterModal } from '../../context/transaction-tag-filter-modal.context';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly onChange: (cb: (prev: TransactionFilterInterface) => TransactionFilterInterface) => void;
}

const continuousCorners = { borderCurve: 'continuous' as const };

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const StatisticsFiltersMenu = ({ filters, onChange }: Props) => {
    const { t } = useLingui();
    const [openAmountFilter] = useTransactionAmountFilterModal();
    const [openCategoryFilter] = useTransactionCategoryFilterModal();
    const [openTagFilter] = useTransactionTagFilterModal();
    const [openAccountFilter] = useTransactionAccountFilterModal();

    const handleAmount = () =>
        void openAmountFilter({ value: filters.amount }, result => {
            if (isDefined(result)) {
                onChange(current => ({ ...current, amount: result.value }));
            }
        });
    const handleCategories = () =>
        void openCategoryFilter({ value: filters.categoryIds }, result => {
            if (isDefined(result)) {
                onChange(current => ({ ...current, categoryIds: result.value }));
            }
        });
    const handleTags = () =>
        void openTagFilter({ value: filters.tagIds }, result => {
            if (isDefined(result)) {
                onChange(current => ({ ...current, tagIds: result.value }));
            }
        });
    const handleAccounts = () =>
        void openAccountFilter({ value: filters.accountIds }, result => {
            if (isDefined(result)) {
                onChange(current => ({ ...current, accountIds: result.value }));
            }
        });
    const handleClear = () => void onChange(current => ({ ...DEFAULT_TRANSACTION_FILTER, date: current.date }));

    const activeCount = [
        isDefined(filters.amount),
        isNotEmptyArray(filters.categoryIds),
        isNotEmptyArray(filters.tagIds),
        isNotEmptyArray(filters.accountIds)
    ].filter(Boolean).length;
    const triggerLabel = activeCount > 0 ? t`Filters · ${activeCount}` : t`Filters`;
    const activeLabel = t`On`;
    const amountLabel = isDefined(filters.amount) ? activeLabel : null;
    const categoryCount = filters.categoryIds?.length ?? 0;
    const tagCount = filters.tagIds?.length ?? 0;
    const accountCount = filters.accountIds?.length ?? 0;
    const categoryLabel = categoryCount > 0 ? String(categoryCount) : null;
    const tagLabel = tagCount > 0 ? String(tagCount) : null;
    const accountLabel = accountCount > 0 ? String(accountCount) : null;

    return (
        <ActionsMenu
            accessibilityLabel={triggerLabel}
            hitSlop={0}
            triggerClassName="min-h-[44px] flex-row items-center justify-center gap-x-md rounded-3xl bg-grouped-surface-row px-3xl py-md active:scale-100 active:opacity-60"
            trigger={
                <View className="flex-row items-center gap-x-md" style={continuousCorners}>
                    <Icon icon={UserIconNameEnum.SlidersHorizontal} size={16} className="text-primary" />
                    <Text maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER} className="text-md font-semibold text-primary">
                        {triggerLabel}
                    </Text>
                </View>
            }
        >
            <ActionsMenuItem icon={UserIconNameEnum.Coins} label={t`Amount`} rightLabel={amountLabel} onPress={handleAmount} />
            <ActionsMenuItem icon={UserIconNameEnum.Shapes} label={t`Categories`} rightLabel={categoryLabel} onPress={handleCategories} />
            <ActionsMenuItem icon={UserIconNameEnum.Tag} label={t`Tags`} rightLabel={tagLabel} onPress={handleTags} />
            <ActionsMenuItem icon={UserIconNameEnum.Wallet} label={t`Accounts`} rightLabel={accountLabel} onPress={handleAccounts} />
            {activeCount > 0 ? (
                <ActionsMenuItem icon={UserIconNameEnum.X} label={t`Clear All`} variant="destructive" onPress={handleClear} />
            ) : null}
        </ActionsMenu>
    );
};
