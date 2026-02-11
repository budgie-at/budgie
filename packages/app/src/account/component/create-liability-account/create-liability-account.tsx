// jscpd:ignore-start
import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
// jscpd:ignore-end
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { accountService } from '../../service/account.service';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH;
    readonly title: string;
}

const DEFAULT_ICON = UserIconNameEnum.Home;

export const CreateLiabilityAccount = ({ type, title }: Props) => {
    const { defaultInstrument } = useSettingsContext();

    const { control, handleSubmit, instrument } = useAccountForm(
        {
            type,
            title: '',
            currentBalance: 0,
            icon: DEFAULT_ICON,
            includeInNetWorth: true,
            instrumentId: defaultInstrument.id
        },
        async values => accountService.create(values)
    );

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    const variant = ACCOUNT_COLOR[type];

    return (
        <CreateAccountScreen
            title={title}
            control={control}
            variant={variant}
            instrumentSymbol={instrument.symbol}
            allowNegativeBalance
            onSubmit={handleSubmit}
        >
            <FormLayoutGroup>
                <AccountDetailsField variant={variant} control={control} />
                <CreateAccountCurrencyField control={control} />
                <IncludeInNetWorthField control={control} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};
