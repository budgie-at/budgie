import { Trans, useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../@generic/components/icon/icon';
import { FullPage } from '../../@generic/components/page/full-page';
import { ICONS, IconName } from '../../@generic/constant/icons.constant';
import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useVibration } from '../../@generic/hooks/use-vibration.hook';
import { CategoryCard } from '../../category/components/category-card/category-card';
import { SwipableRow } from '../../category/components/category-card/swipableRow';
import { CreateCategoryBottomSheet } from '../../category/components/create-category-bottom-sheet/create-category-bottom-sheet';
import { useGetCategoriesLiveQuery } from '../../category/query/use-get-categories.live-query';

export default function Categories() {
    const { t } = useLingui();
    const [notify] = useVibration();
    const [search, setSearch] = useState('');
    const { categories } = useGetCategoriesLiveQuery();

    const ref = useRef<{ open: (categoryId: number | null) => void } | null>(null);

    const handleOpenCategory = (id: number) => void ref.current?.open(id);
    const handleOpen = () => void ref.current?.open(null);

    const handleDeleteCategory = async (id: number) => {
        await categoryRepository.deleteById(id);
        notify(NotificationFeedbackType.Success);
    };

    const icon = isNotEmptyString(search) ? ICONS.Search : ICONS.Folder;

    return (
        <FullPage>
            <View className={'pb-7xl border-b border-b-secondary-corner'}>
                <Text className={'text-6xl text-primary mb-7xl'}>
                    <Trans>Categories</Trans>
                </Text>

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t`Search categories...`}
                    className={
                        'text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner'
                    }
                />
            </View>

            {isNotEmptyArray(categories) ? (
                <ScrollView className={'flex-1'}>
                    <Animated.View
                        style={{ paddingTop: 30, rowGap: 20 }}
                        className={'gap-y-xl flex-1 pt-7xl'}
                        layout={LinearTransition.damping(22).stiffness(220)}
                    >
                        {categories.map(category => (
                            <Animated.View
                                key={category.id}
                                entering={FadeIn.duration(180)}
                                exiting={FadeOut.duration(180)}
                                layout={LinearTransition.damping(22).stiffness(220)}
                            >
                                <SwipableRow onDelete={() => void handleDeleteCategory(category.id)}>
                                    <CategoryCard
                                        onOpen={handleOpenCategory}
                                        id={category.id}
                                        title={category.title}
                                        icon={category.icon as IconName}
                                    />
                                </SwipableRow>
                            </Animated.View>
                        ))}
                    </Animated.View>
                </ScrollView>
            ) : (
                <View className={'items-center pt-[70px] flex-1'}>
                    <View className={'bg-secondary-background p-3xl rounded-3xl mb-3xl'}>
                        <Icon icon={icon} className={'text-secondary-foreground'} size={32} />
                    </View>

                    <Text className={'text-primary text-lg mb-md'}>
                        {isNotEmptyString(search) ? <Trans>No Results</Trans> : <Trans>No Custom Categories</Trans>}
                    </Text>
                    <Text className={'text-secondary-foreground text-sm'}>
                        {isNotEmptyString(search) ? (
                            <Trans>No categories match your search</Trans>
                        ) : (
                            <Trans>Custom categories you create will appear here</Trans>
                        )}
                    </Text>
                </View>
            )}

            <Pressable onPress={handleOpen} className={'absolute bottom-1/10 right-10 bg-primary rounded-full p-3xl active:scale-[0.95]'}>
                <Icon icon={ICONS.Plus} className={'text-primary-reverse'} size={32} />
            </Pressable>

            <CreateCategoryBottomSheet ref={ref} />
        </FullPage>
    );
}
