import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { IconSelector } from '../../../@generic/components/icon-selector/icon-selector';

interface Props {
    readonly field: { value: UserIconNameEnum; onChange: (value: UserIconNameEnum) => void };
}

export const CreateAccountIconSelector = ({ field: { value, onChange } }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem label={t`Icon`}>
            <IconSelector icon={value} onSelect={onChange} />
        </FormItem>
    );
};
