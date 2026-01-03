import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

export const TransactionFormComment = () => {
    const { t } = useLingui();
    const { control } = useFormContext<TransactionCreateInputInterface>();

    const renderNote = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateInputInterface, 'comment'>) => (
        <FormItem label={t`Note (optional)`}>
            <Input value={value} onChangeText={onChange} className="p-xl h-[100px]" placeholder={t`Add a note...`} multiline />
        </FormItem>
    );

    return <Controller control={control} render={renderNote} name="comment" />;
};
