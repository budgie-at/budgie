import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountFormDatePicker } from '../account-form-date-picker/account-form-date-picker';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: Date | null;
    readonly onChange: (value: Date | null) => void;
    readonly variant: ColorPaletteVariant;
}

export const AccountFormDateField = ({ value, onChange, variant }: Props) => {
    const { t } = useLingui();

    const fieldVariant = isDefined(value) ? variant : 'secondary';

    return (
        <FormItem className="w-auto" label={t`Expected Return Date (Optional)`}>
            <AccountFormDatePicker
                testID={CreateAccountScreenSelector.ReturnDateButton}
                variant={fieldVariant}
                date={value}
                onChange={onChange}
            />
        </FormItem>
    );
};
