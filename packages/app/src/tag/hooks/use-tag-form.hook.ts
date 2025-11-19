import { TagCreateEntityInterface, TagCreateEntitySchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

const DEFAULT_VALUES: TagCreateEntityInterface = { title: '' };

export const useTagForm = (defaultValues: TagCreateEntityInterface | null) => {
    const form = useForm({
        resolver: zodResolver(TagCreateEntitySchema),
        defaultValues: defaultValues ?? DEFAULT_VALUES,
        mode: 'onSubmit'
    });

    const title = useWatch({
        control: form.control,
        name: 'title'
    });

    return {
        ...form,
        title
    };
};
