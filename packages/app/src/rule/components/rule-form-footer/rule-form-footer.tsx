import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { FormFooter } from '../../../@generic/component/form-footer/form-footer';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
}

export const RuleFormFooter = ({ variant, buttonText, onSubmit, onDelete }: Props) => {
    const { t } = useLingui();

    return (
        <FormFooter
            variant={variant}
            buttonText={buttonText}
            onSubmit={onSubmit}
            onDelete={onDelete}
            deleteConfirmTitle={t`Are you sure you want to delete this rule?`}
            deleteConfirmButtonText={t`Delete rule`}
        />
    );
};
