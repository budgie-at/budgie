import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { accountService } from '../../service/account.service';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH;
    readonly title: string;
}

const DEFAULT_ICON = UserIconNameEnum.Home;

export const CreateLiabilityAccount = ({ type, title }: Props) => {
    const { defaultInstrument } = useSettingsContext();

    const { control, handleSubmit, instrument, setValue, watch } = useAccountForm(
        {
            type,
            title: '',
            currentBalance: 0,
            icon: DEFAULT_ICON,
            instrumentId: defaultInstrument.id
        },
        async values => accountService.create(values)
    );

    const instrumentId = watch('instrumentId');

    const handleInstrumentChange = (newInstrumentId: number) => {
        setValue('instrumentId', newInstrumentId);
    };

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
            instrumentId={instrumentId}
            onSubmit={handleSubmit}
            onInstrumentChange={handleInstrumentChange}
        >
            <FormLayoutGroup>
                <AccountDetailsField variant={variant} control={control} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};
