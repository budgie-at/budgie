import { AccountEntityInterface, AccountUpdateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { FullPage } from '../../../@generic/components/page/full-page';
import { accountRepository } from '../../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { accountService } from '../../service/account.service';
import { CreateAccountBalanceField } from '../create-account-balance-field/create-account-balance-field';
import { CreateAccountIconSelector } from '../create-account-icon-selector/create-account-icon-selector';
import { CreateAccountTitle } from '../create-account-title/create-account-title';
import { UpdateAccountHeader } from '../update-account-header/update-account-header';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { t } = useLingui();

    const { control, handleSubmit, reset, instrument, prepareSubmitData } = useAccountForm({
        ...account,
        currentBalance: convertFromMicroUnits(account.currentBalance)
    });

    const handleUpdate = async (values: AccountUpdateEntityInterface) => {
        try {
            await accountService.updateById(account.id, prepareSubmitData(values));

            void router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Please try again later`
            });
        }
    };

    const handleArchive = async () => {
        try {
            await accountRepository.deleteById(account.id);

            void router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Please try again later`
            });
        }
    };

    if (!isDefined(instrument)) {
        return null;
    }

    const goBack = () => {
        reset();
        void router.navigate(`/account/${account.id}`);
    };

    return (
        <FullPage header={<UpdateAccountHeader onGoBack={goBack} accountType={account.type} />}>
            <CreateAccountBalanceField instrumentSymbol={instrument.symbol} control={control} />

            <FormLayoutGroup className="mb-8xl">
                <Controller control={control} name="title" render={CreateAccountTitle} />
                <Controller control={control} name="icon" render={CreateAccountIconSelector} />
            </FormLayoutGroup>

            <View className="gap-y-xl">
                <Button onPress={handleSubmit(handleUpdate)} size="sm" variant="default" content={t`Update Account`} />
                <Button onPress={handleArchive} size="sm" variant="dark-warning" content={t`Archive Account`} leftIcon="Archive" />
            </View>
        </FullPage>
    );
};
