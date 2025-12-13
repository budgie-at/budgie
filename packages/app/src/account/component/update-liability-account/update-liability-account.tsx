import { AccountCreateEntityInterface, AccountEntityInterface } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { FullPage } from '../../../@generic/components/page/full-page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { accountRepository } from '../../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../create-account-balance-field/account-balance-field';
import { UpdateAccountIconField } from '../create-account-icon-field/update-account-icon-field';
import { UpdateAccountTitleField } from '../update-account-title-field/update-account-title-field';

interface Props {
    readonly account: AccountEntityInterface;
}

const descriptionVariants = cva('uppercase', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { t } = useLingui();

    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useAccountForm({
        type: account.type,
        icon: account.icon,
        title: account.title,
        nature: account.nature,
        instrumentId: account.instrumentId,
        currentBalance: convertFromMicroUnits(balance)
    });

    const handleUpdate = async (values: AccountCreateEntityInterface) => {
        try {
            await accountService.updateById(account.id, values);

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

    const variant = ACCOUNT_COLOR[account.type];

    if (!isDefined(instrument)) {
        return <View />;
    }

    return (
        <FullPage
            header={
                <PageHeader
                    showBackBtn
                    icon={account.icon}
                    iconVariant={variant}
                    title={t`Account Settings`}
                    descriptionClassName={descriptionVariants({ variant })}
                    description={i18n.t(ACCOUNT_TYPE[account.type])}
                />
            }
        >
            <AccountBalanceField variant={variant} instrumentSymbol={instrument.symbol} control={control} />

            <FormLayoutGroup className="mb-8xl">
                <UpdateAccountTitleField control={control} />
                <UpdateAccountIconField variant={variant} control={control} />
            </FormLayoutGroup>

            <View className="gap-y-xl">
                <Button onPress={handleSubmit(handleUpdate)} size="sm" variant={variant} content={t`Update Account`} />
                <Button onPress={handleArchive} size="sm" variant="dark-warning" content={t`Archive Account`} leftIcon="Archive" />
            </View>
        </FullPage>
    );
};
