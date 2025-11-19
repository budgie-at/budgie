import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../@generic/components/page/page';
import { CategoriesList } from '../../category/components/categories-list/categories-list';
import { CreateCategory } from '../../category/components/create-category/create-category';
import { CustomCategoriesEmptyState } from '../../category/components/custom-categories-empty-state/custom-categories-empty-state';
import { useGetCategoriesLiveQuery } from '../../category/query/use-get-categories.live-query';

export default function Categories() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { categories } = useGetCategoriesLiveQuery(search, false);

    return (
        <Page>
            <View className="pb-7xl border-b border-b-secondary-corner">
                <Text className="text-6xl text-primary mb-7xl">
                    <Trans>Categories</Trans>
                </Text>

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t`Search categories...`}
                    className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                />
            </View>

            {isNotEmptyArray(categories) ? <CategoriesList categories={categories} /> : <CustomCategoriesEmptyState search={search} />}

            <CreateCategory />
        </Page>
    );
}
