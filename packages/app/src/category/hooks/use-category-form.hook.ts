import { CategoryCreateEntityInterface, CategoryCreateEntitySchema, UserIconNameEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

const DEFAULT_VALUES: CategoryCreateEntityInterface = { icon: UserIconNameEnum.Home, title: '' };

export const useCategoryForm = (defaultValues: CategoryCreateEntityInterface | null) => {
    const form = useForm({
        resolver: zodResolver(CategoryCreateEntitySchema),
        defaultValues: defaultValues ?? DEFAULT_VALUES,
        values: defaultValues ?? DEFAULT_VALUES,
        mode: 'onSubmit',
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
