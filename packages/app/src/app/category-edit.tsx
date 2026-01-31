import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { IconSelectorBottomSheet } from '../@generic/component/icon-selector-bottom-sheet/icon-selector-bottom-sheet';
import { ModalPage } from '../@generic/component/page/modal-page';
import { PageHeader } from '../@generic/component/page-header/page-header';
import { categoryRepository } from '../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../@generic/interface/bottom-sheet.interface';
import { CategoryAiFields } from '../category/components/category-ai-fields/category-ai-fields';
import { CategoryIconDisplay } from '../category/components/category-icon-display/category-icon-display';
import { CategoryTitleInput } from '../category/components/category-title-input/category-title-input';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { useRegenerateCategoryTranslation } from '../category/hooks/use-regenerate-category-translation.hook';
import { categoryService } from '../category/service/category.service';

// eslint-disable-next-line max-lines-per-function, max-statements -- Category edit modal with form state management
export default function CategoryEditModal() {
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
    const lastRegeneratedTitle = useRef<string>('');

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
                lastRegeneratedTitle.current = loadedCategory.title;
            }
        };

        void loadCategory();
    }, [categoryId]);

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
            lastRegeneratedTitle.current = title;
        }
    };

    const handleTitleBlur = () => {
        const titleChanged = title !== lastRegeneratedTitle.current;
        const hasValidTitle = isNotEmptyString(title);

        if (titleChanged && hasValidTitle && !isRegenerating) {
            void handleRegenerate();
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
        return <ModalPage header={<PageHeader title={t`Edit Category`} onGoBack={handleCancel} />} />;
    }

    return (
        <ModalPage header={<PageHeader title={t`Edit Category`} onGoBack={handleCancel} />}>
            <View className="flex-1">
                <CategoryIconDisplay icon={icon} onPress={handleIconPress} />

                <CategoryTitleInput value={title} onChange={setTitle} onBlur={handleTitleBlur} />

                <CategoryAiFields titleEn={titleEn} titleTags={titleTags} isRegenerating={isRegenerating} onRegenerate={handleRegenerate} />
            </View>

            <View className="px-3xl pb-3xl gap-y-md pt-xl">
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={UserIconNameEnum.Merge}
                    onPress={handleMerge}
                    content={<Trans>Merge into another category</Trans>}
                />

                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={handleCancel} content={<Trans>Cancel</Trans>} />
                    <Button className="flex-1" variant="cta" onPress={handleSave} disabled={isSaveDisabled} content={<Trans>Save</Trans>} />
                </View>
            </View>

            <IconSelectorBottomSheet ref={iconSelectorRef} variant="default" selectedIcon={icon} onSelect={handleIconSelect} />
        </ModalPage>
    );
}
