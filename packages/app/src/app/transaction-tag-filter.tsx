/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { Footer } from '../@generic/component/footer/footer';
import { HapticPressable } from '../@generic/component/haptic-pressable/haptic-pressable';
import { Input } from '../@generic/component/input/input';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
/* jscpd:ignore-end */
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';
import { TransactionTagFilterItem } from '../transaction/components/transaction-tag-filter/transaction-tag-filter-item';
import { useTransactionTagFilterModal } from '../transaction/context/transaction-tag-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export default function TransactionTagFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    /* jscpd:ignore-start */
    const { currentParams, resolveTransactionTagFilter } = useTransactionTagFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue] = useState<number[] | null>(() => currentParams?.value ?? null);
    const [search, setSearch] = useState('');

    const { tags, total } = useSearchTagsQuery(search);

    const localSelectedCount = localValue?.length ?? 0;
    const buttonText = isPositiveNumber(localSelectedCount) ? t`Apply Filter (${localSelectedCount})` : t`Apply Filter`;
    const containerStyle = { flex: 1, backgroundColor };
    const items = tags ?? [];
    const showControls = !(isEmptyArray(items) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);
    /* jscpd:ignore-end */

    /* jscpd:ignore-start */
    const handleSelect = (selected: number) => {
        setLocalValue(prev => toggleFilterSelection(prev, [selected]));
    };

    const handleSelectAll = () => void setLocalValue(items.map(item => item.id));
    const handleDeselectAll = () => void setLocalValue(null);
    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionTagFilter({ value: localValue });
    };
    /* jscpd:ignore-end */

    const handleNavigateToCreate = () => {
        resolveTransactionTagFilter(null);
        router.push('/settings/tags');
    };

    return (
        <View style={containerStyle}>
            <TransactionFilterHeader
                title={t`Tags`}
                icon={UserIconNameEnum.Hash}
                onClear={handleClear}
                showClear={isPositiveNumber(localSelectedCount)}
            />

            <ScrollView contentContainerClassName="py-[40px] px-7xl gap-y-3xl">
                {/* jscpd:ignore-start */}
                {showControls ? (
                    <View className="gap-y-3xl">
                        <Input placeholder={t`Search tags...`} value={search} onChangeText={setSearch} />

                        <View className="flex-row gap-x-md">
                            <HapticPressable className="py-md px-xl rounded-3xl bg-secondary-background" onPress={handleSelectAll}>
                                <Text className="text-secondary-foreground text-xs font-medium">
                                    <Trans>Select All</Trans>
                                </Text>
                            </HapticPressable>
                            <HapticPressable className="py-md px-xl rounded-3xl bg-secondary-background" onPress={handleDeselectAll}>
                                <Text className="text-secondary-foreground text-xs font-medium">
                                    <Trans>Deselect All</Trans>
                                </Text>
                            </HapticPressable>
                        </View>
                    </View>
                ) : null}
                {/* jscpd:ignore-end */}

                {isNotEmptyArray(items) ? (
                    <View>
                        {items.map((tag, index) => (
                            <TransactionTagFilterItem
                                tag={tag}
                                key={tag.id}
                                onSelect={handleSelect}
                                isFirst={index === 0}
                                isLast={index === items.length - 1}
                                isSelected={localValue?.includes(tag.id) ?? false}
                            />
                        ))}
                    </View>
                ) : null}

                {/* jscpd:ignore-start */}
                {isEmptyArray(items) && showEmptySearch ? (
                    <View className="items-center border border-secondary-corner rounded-5xl bg-secondary-background px-xl py-[30px]">
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>No tags found</Trans>
                        </Text>
                    </View>
                ) : null}

                {isEmptyArray(items) && !showEmptySearch ? (
                    <TransactionFilterEmptyState
                        icon={UserIconNameEnum.Hash}
                        title={t`No Tags Yet`}
                        buttonText={t`Create Tags`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create custom tags in Settings to label and filter your transactions`}
                    />
                ) : null}
            </ScrollView>

            <Footer>
                <Button variant="ghost" onPress={handleApply} content={buttonText} />
            </Footer>
            {/* jscpd:ignore-end */}
        </View>
    );
}
