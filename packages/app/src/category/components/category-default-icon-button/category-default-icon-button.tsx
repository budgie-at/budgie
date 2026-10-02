import { DEFAULT_CATEGORY_ICON, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useNonSystemCategoriesQuery } from '../../query/use-non-system-categories.query';

import { CategoryDefaultIconButtonSelector } from './category-default-icon-button.selector';

export const CategoryDefaultIconButton = () => {
    const { t } = useLingui();
    const router = useRouter();
    const { categories } = useNonSystemCategoriesQuery();

    const count = categories.filter(category => category.icon === DEFAULT_CATEGORY_ICON).length;

    const handlePress = () => void router.push('/settings/category-icons');

    if (!isPositiveNumber(count)) {
        return null;
    }

    return (
        <Button
            testID={CategoryDefaultIconButtonSelector.Button}
            onPress={handlePress}
            size="sm"
            variant="secondary"
            leftIcon={UserIconNameEnum.Sparkles}
            className="mb-xl"
            content={t({ message: plural(count, { one: '# category uses the default icon', other: '# categories use the default icon' }) })}
        />
    );
};
