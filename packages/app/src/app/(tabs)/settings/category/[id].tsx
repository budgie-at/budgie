import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { GoBackButton } from '../../../../@generic/component/go-back-button/go-back-button';
import { IconSelectorBottomSheet } from '../../../../@generic/component/icon-selector-bottom-sheet/icon-selector-bottom-sheet';
import { ScreenLayout } from '../../../../@generic/component/screen-layout/screen-layout';
import { categoryRepository } from '../../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../../@generic/interface/bottom-sheet.interface';
import { CategoryAiFields } from '../../../../category/components/category-ai-fields/category-ai-fields';
import { CategoryIconDisplay } from '../../../../category/components/category-icon-display/category-icon-display';
import { CategoryTitleInput } from '../../../../category/components/category-title-input/category-title-input';
import { useCategorySelectorModal } from '../../../../category/context/category-selector-modal.context';
import { useRegenerateCategoryTranslation } from '../../../../category/hooks/use-regenerate-category-translation.hook';
import { categoryService } from '../../../../category/service/category.service';

const TITLE_INPUT_DELAY = 100;
const AI_FIELDS_DELAY = 200;
const ACTIONS_DELAY = 400;

// eslint-disable-next-line max-lines-per-function, max-statements -- Category edit page with form state management
export default function CategoryEditPage() {
    const { t } = useLingui();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { openCategorySelector } = useCategorySelectorModal();
    const { regenerate, isRegenerating } = useRegenerateCategoryTranslation();

    const [category, setCategory] = useState<CategoryEntityInterface | null>(null);
    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState<UserIconNameEnum>(UserIconNameEnum.Folder);
    const [titleEn, setTitleEn] = useState<string | null>(null);
    const [titleTags, setTitleTags] = useState<string | null>(null);

    const iconSelectorRef = useRef<BottomSheetInterface | null>(null);

    const categoryId = Number(id);
    const isSaveDisabled = !isNotEmptyString(title);

    useEffect(() => {
        const loadCategory = async () => {
            const loadedCategory = await categoryRepository.findById(categoryId);

            if (isDefined(loadedCategory)) {
                setCategory(loadedCategory);
                setTitle(loadedCategory.title);
                setIcon(loadedCategory.icon);
                setTitleEn(loadedCategory.titleEn);
                setTitleTags(loadedCategory.titleTags);
            }
        };

        void loadCategory();
    }, [categoryId]);

    const handleGoBack = () => {
        router.back();
    };

    const handleIconPress = () => {
        iconSelectorRef.current?.open();
    };

    const handleIconSelect = (selectedIcon: UserIconNameEnum) => {
        setIcon(selectedIcon);
    };

    const handleRegenerate = async () => {
        const result = await regenerate(categoryId, title);

        if (isDefined(result)) {
            setTitleEn(result.titleEn);
            setTitleTags(result.titleTags);
        }
    };

    const handleMerge = async () => {
        const targetCategoryId = await openCategorySelector({
            excludeCategoryIds: [categoryId],
            description: t`Select a category to merge into`,
            variant: 'primary'
        });

        if (!isDefined(targetCategoryId)) {
            return;
        }

        try {
            await categoryService.mergeInto(categoryId, targetCategoryId);
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not merge category`,
                text2: t`Please try again later`
            });
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!isPositiveNumber(categoryId)) {
            return;
        }

        try {
            await categoryRepository.updateById(categoryId, { title, icon });
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not save category`,
                text2: t`Please try again later`
            });
        }
    };

    if (!isDefined(category)) {
        return (
            <ScreenLayout>
                <View />
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout>
            <View className="flex-1">
                <View className="px-5xl pt-md">
                    <GoBackButton onPress={handleGoBack} />
                </View>

                <ScrollView className="flex-1" contentContainerClassName="pb-3xl" keyboardShouldPersistTaps="handled">
                    <CategoryIconDisplay icon={icon} onPress={handleIconPress} />

                    <CategoryTitleInput value={title} onChange={setTitle} animationDelay={TITLE_INPUT_DELAY} />

                    <CategoryAiFields
                        titleEn={titleEn}
                        titleTags={titleTags}
                        isRegenerating={isRegenerating}
                        onRegenerate={handleRegenerate}
                        animationDelay={AI_FIELDS_DELAY}
                    />
                </ScrollView>

                <Animated.View
                    entering={FadeInUp.delay(ACTIONS_DELAY).duration(200)}
                    className="px-3xl pb-3xl gap-y-md border-t border-secondary-corner pt-xl"
                >
                    <View className="flex-row gap-x-md">
                        <Button className="flex-1" variant="ghost" onPress={handleCancel} content={<Trans>Cancel</Trans>} />
                        <Button
                            className="flex-1"
                            variant="cta"
                            onPress={handleSave}
                            disabled={isSaveDisabled}
                            content={<Trans>Save</Trans>}
                        />
                    </View>

                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={UserIconNameEnum.Merge}
                        onPress={handleMerge}
                        content={<Trans>Merge into another category</Trans>}
                    />
                </Animated.View>
            </View>

            <IconSelectorBottomSheet ref={iconSelectorRef} variant="default" selectedIcon={icon} onSelect={handleIconSelect} />
        </ScreenLayout>
    );
}
