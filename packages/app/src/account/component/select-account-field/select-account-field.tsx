import { useLingui } from '@lingui/react/macro';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelector } from '../account-selector/account-selector';

interface Props {
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (accountId: number) => void;
}

export const SelectAccountField = ({ accountId, onChange, variant }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem label={t`Account`}>
            <AccountSelector
                variant={variant}
                accountId={accountId}
                onSelect={onChange}
                emptyStateDescription={t`Create your first account to start tracking transactions`}
            />
        </FormItem>
    );
};
