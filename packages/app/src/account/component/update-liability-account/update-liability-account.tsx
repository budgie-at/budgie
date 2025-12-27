import { AccountEntityInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { Button } from '../../../@generic/component/button/button';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { ArchiveAccount } from '../archive-account/archive-account';

interface Props {
    readonly account: AccountEntityInterface;
}

const descriptionVariants = cva('uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { t } = useLingui();

    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useAccountForm({
        iban: account.iban,
        type: account.type,
        icon: account.icon,
        title: account.title,
        order: account.order,
        parentId: account.parentId,
        instrumentId: account.instrumentId,
        includeInNetWorth: account.includeInNetWorth,
        targetBalance: convertFromMicroUnits(balance)
    });

    const handleGoBack = () => void goBackOrReplace('/');

    const handleUpdate = async (values: LiabilityAccountCreateInputInterface) => {
        try {
            await accountService.updateById(account.id, values);

            handleGoBack();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Could not update account. Please try again later`
            });
        }
    };

    const variant = ACCOUNT_COLOR[account.type];

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <FullPage
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    icon={account.icon}
                    iconVariant={variant}
                    title={t`Account Settings`}
                    descriptionClassName={descriptionVariants({ variant })}
                    description={i18n.t(ACCOUNT_TYPE[account.type])}
                />
            }
        >
            <KeyboardAwareScrollView
                contentContainerClassName="flex-1"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1">
                    <AccountBalanceField variant={variant} instrumentSymbol={instrument.symbol} control={control} />

                    <AccountDetailsField control={control} variant={variant} />
                </View>

                <View className="gap-y-xl">
                    <Button onPress={handleSubmit(handleUpdate)} size="sm" variant={variant} content={t`Update Account`} />
                    <ArchiveAccount accountId={account.id} />
                </View>
            </KeyboardAwareScrollView>
        </FullPage>
    );
};
