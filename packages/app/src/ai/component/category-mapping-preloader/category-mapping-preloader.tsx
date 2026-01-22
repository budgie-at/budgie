import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useCategoryMapping } from '../../hook/use-category-mapping.hook';

export const CategoryMappingPreloader = (): null => {
    const { categories } = useAllCategoriesQuery();
    const language = useSetting('language');

    useCategoryMapping(categories, language);

    return null;
};
