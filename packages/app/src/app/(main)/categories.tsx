import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../@generic/components/icon/icon';
import { Page } from '../../@generic/components/page/page';
import { ICONS } from '../../@generic/constant/icons.constant';
import { CategoriesList } from '../../category/components/categories-list/categories-list';
import { CreateCategory } from '../../category/components/create-category/create-category';
import { CustomCategoriesEmptyState } from '../../category/components/custom-categories-empty-state/custom-categories-empty-state';
import { useGetCategoriesLiveQuery } from '../../category/query/use-get-categories.live-query';

export default function Categories() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { categories } = useGetCategoriesLiveQuery(search, false);

    const goBack = () => void router.back();

    return (
        <Page
            header={
                <View className="pb-7xl px-5xl border-b border-b-secondary-corner">
                    <View className="flex-row items-center justify-between mb-7xl">
                        <Text className="text-6xl text-primary">
                            <Trans>Categories</Trans>
                        </Text>

                        <HapticPressable onPress={goBack}>
                            <Icon icon={ICONS.X} />
                        </HapticPressable>
                    </View>

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t`Search categories...`}
                        className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                    />
                </View>
            }
        >
            {isNotEmptyArray(categories) ? <CategoriesList categories={categories} /> : <CustomCategoriesEmptyState search={search} />}

            <CreateCategory />
        </Page>
    );
}
