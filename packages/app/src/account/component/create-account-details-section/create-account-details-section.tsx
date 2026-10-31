import { InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'instrumentId'>;
    readonly variant: ColorPaletteVariant;
    readonly namePlaceholder: string;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly onInstrumentChange: (instrumentId: number) => void;
}

export const CreateAccountDetailsSection = ({ fields, variant, namePlaceholder, instrumentType, onInstrumentChange }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListSection title={t`Details`}>
            <AccountDetailsField
                variant={variant}
                titleBinding={fields.title}
                iconBinding={fields.icon}
                placeholder={namePlaceholder}
                nameInputTestID={CreateAccountScreenSelector.NameInput}
            />
            <CreateAccountCurrencyField
                value={fields.instrumentId.field.value}
                onChange={onInstrumentChange}
                instrumentType={instrumentType}
                variant={variant}
                note={t`Can't be changed later`}
            />
        </GroupedListSection>
    );
};
