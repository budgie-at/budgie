import { CategoryCreateEntityInterface, CategoryCreateEntitySchema, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import type { UseFormReturn } from 'react-hook-form';

const DEFAULT_VALUES: CategoryCreateEntityInterface = { icon: UserIconNameEnum.Folder, title: '' };

export const useCategoryForm = (
    defaultValues: CategoryEntityInterface | null,
    defaultTitle?: string
): UseFormReturn<CategoryCreateEntityInterface> & {
    readonly icon: CategoryCreateEntityInterface['icon'];
    readonly title: CategoryCreateEntityInterface['title'];
} => {
    const form = useForm({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(CategoryCreateEntitySchema)),
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
    }, [defaultTitle, defaultValues, form]);

    return {
        ...form,
        icon,
        title
    };
};
