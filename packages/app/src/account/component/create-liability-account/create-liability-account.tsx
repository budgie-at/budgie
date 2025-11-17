import {
    AccountCreateEntityInterface,
    AccountCreateEntitySchema,
    AccountNatureEnum,
    AccountTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { Edges } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/components/page/page';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instruments-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { accountService } from '../../service/account.service';
import { CreateAccountBalanceInput } from '../create-account-balance-input/create-account-balance-input';
import { CreateAccountCurrencySelector } from '../create-account-currency-selector/create-account-currency-selector';
import { CreateAccountHeader } from '../create-account-header/create-account-header';
import { CreateAccountTitle } from '../create-account-title/create-account-title';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH;
    readonly title: string;
}

const safeEdges: Edges = ['top', 'bottom'];
const DEFAULT_ICON = UserIconNameEnum.Home;

export const CreateLiabilityAccount = ({ type, title }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const { control, handleSubmit, reset } = useForm({
        resolver: zodResolver(AccountCreateEntitySchema),
        mode: 'onSubmit',
        defaultValues: {
            type,
            title: '',
            currentBalance: 0,
            icon: DEFAULT_ICON,
            instrumentId: defaultInstrument.id,
            nature: AccountNatureEnum.LIABILITY
        }
    });

    const instrumentId = useWatch({
        control,
        name: 'instrumentId'
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    if (!isDefined(instrument)) {
        return null;
    }

    const handleCreate = async (values: AccountCreateEntityInterface) => {
        try {
            await accountService.create({
                ...values,
                currentBalance: convertToMicroUnits(values.currentBalance)
            });

            void router.dismissAll();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Please try again later`
            });
        }
    };

    const goBack = () => {
        reset();
        void router.back();
    };

    const renderAccountBalanceInput = ({ field }: { field: { value: number; onChange: (value: number) => void } }) => (
        <CreateAccountBalanceInput instrumentSymbol={instrument.symbol} value={field.value} onChange={field.onChange} />
    );

    return (
        <Page
            safeEdges={safeEdges}
            header={<CreateAccountHeader onGoBack={goBack} title={title} description={t`Fill in the account details`} />}
            footer={
                <View className="pt-3xl px-5xl border-t-1 border-t-secondary-corner">
                    <Button variant="default" onPress={handleSubmit(handleCreate)} content={t`Submit`} />
                </View>
            }
        >
            <Controller render={renderAccountBalanceInput} name="currentBalance" control={control} />

            <FormLayoutGroup>
                <Controller control={control} name="title" render={CreateAccountTitle} />
                <Controller control={control} name="instrumentId" render={CreateAccountCurrencySelector} />
            </FormLayoutGroup>
        </Page>
    );
};
