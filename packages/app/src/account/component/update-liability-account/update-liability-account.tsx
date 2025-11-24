import { AccountCreateEntityInterface, AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { FullPage } from '../../../@generic/components/page/full-page';
import { accountRepository } from '../../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../create-account-balance-field/account-balance-field';
import { UpdateAccountIconField } from '../create-account-icon-field/update-account-icon-field';
import { UpdateAccountHeader } from '../update-account-header/update-account-header';
import { UpdateAccountTitleField } from '../update-account-title-field/update-account-title-field';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { t } = useLingui();

    const { control, handleSubmit, reset, instrument, prepareSubmitData } = useAccountForm({
        ...account,
        currentBalance: convertFromMicroUnits(account.currentBalance)
    });

    const handleUpdate = async (values: AccountCreateEntityInterface) => {
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

    const variant = ACCOUNT_COLOR[account.type]

    if (!isDefined(instrument)) {
        return null;
    }

    const goBack = () => {
        reset();
        void router.navigate(`/account/${account.id}`);
    };

    return (
        <FullPage header={<UpdateAccountHeader onGoBack={goBack} accountType={account.type} icon={account.icon} />}>
            <AccountBalanceField variant={variant} instrumentSymbol={instrument.symbol} control={control} />

            <FormLayoutGroup className="mb-8xl border">
                <UpdateAccountTitleField control={control} />
                <UpdateAccountIconField variant={variant} control={control} />
            </FormLayoutGroup>

            <View className="gap-y-xl">
                <Button onPress={handleSubmit(handleUpdate)} size="sm" variant="default" content={t`Update Account`} />
                <Button onPress={handleArchive} size="sm" variant="dark-warning" content={t`Archive Account`} leftIcon="Archive" />
            </View>
        </FullPage>
    );
};
