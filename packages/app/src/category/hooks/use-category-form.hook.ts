import { CategoryCreateEntityInterface, CategoryCreateEntitySchema, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';
import { useForm, useWatch } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import type { UseFormReturn } from 'react-hook-form';

const DEFAULT_VALUES: CategoryCreateEntityInterface = { icon: UserIconNameEnum.Folder, title: '' };

export const useCategoryForm = (
    defaultValues: CategoryEntityInterface | null,
    defaultTitle?: string
): UseFormReturn<CategoryCreateEntityInterface> & {
    readonly icon: CategoryCreateEntityInterface['icon'];
    readonly title: CategoryCreateEntityInterface['title'];
} => {
    const initialValues = defaultValues ?? { ...DEFAULT_VALUES, ...(isNotEmptyString(defaultTitle) && { title: defaultTitle }) };

    const form = useForm({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(CategoryCreateEntitySchema)),
        defaultValues: initialValues,
        values: initialValues,
        mode: 'onSubmit'
    });

    const [icon, title] = useWatch({
        control: form.control,
        name: ['icon', 'title']
    });

    return {
        ...form,
        icon,
        title
    };
};
