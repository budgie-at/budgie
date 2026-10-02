import { TagCreateEntityInterface, TagCreateEntitySchema } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';
import { useForm, useWatch } from 'react-hook-form';

const DEFAULT_VALUES: TagCreateEntityInterface = { title: '' };

export const useTagForm = (defaultValues: TagCreateEntityInterface | null) => {
    const { reset, control, ...rest } = useForm({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(TagCreateEntitySchema)),
        defaultValues: defaultValues ?? DEFAULT_VALUES,
        values: defaultValues ?? DEFAULT_VALUES,
        mode: 'onSubmit'
    });

    const title = useWatch({
        name: 'title',
        control
    });

    return {
        ...rest,
        control,
        reset,
        title
    };
};
