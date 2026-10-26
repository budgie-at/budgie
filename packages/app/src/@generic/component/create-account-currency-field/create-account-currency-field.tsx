import { InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CurrencySelector } from '../currency-selector/currency-selector';
import { FormItem } from '../form-item/form-item';

interface Props {
    readonly value: number;
    readonly onChange: (instrumentId: number) => void;
    readonly instrumentType?: InstrumentTypeEnum;
}

export const CreateAccountCurrencyField = ({ value, onChange, instrumentType }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem label={t`Currency`}>
            <CurrencySelector
                testID={CreateAccountScreenSelector.CurrencySelector}
                instrumentId={value}
                instrumentType={instrumentType}
                onChange={onChange}
            />
        </FormItem>
    );
};
