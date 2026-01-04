import { CategoryCreateEntityInterface, CategoryCreateEntitySchema, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

const DEFAULT_VALUES: CategoryCreateEntityInterface = { icon: UserIconNameEnum.Home, title: '' };

export const useCategoryForm = (defaultValues: CategoryEntityInterface | null, defaultTitle?: string) => {
    const form = useForm({
        resolver: zodResolver(CategoryCreateEntitySchema),
        defaultValues: defaultValues ?? DEFAULT_VALUES,
        values: defaultValues ?? DEFAULT_VALUES,
        mode: 'onSubmit'
    });

    const [icon, title] = useWatch({
        control: form.control,
        name: ['icon', 'title']
    });

    useEffect(() => {
        if (!isDefined(defaultValues) && isNotEmptyString(defaultTitle)) {
            form.setValue('title', defaultTitle);
        }
    }, [defaultTitle, defaultValues, form.setValue]);

    return {
        ...form,
        icon,
        title
    };
};
