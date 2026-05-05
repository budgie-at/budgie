import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { AccountBankSyncCard } from '../../../sync/component/account-bank-sync-card/account-bank-sync-card';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useAccountForm(
        {
            externalId: account.externalId,
            iban: account.iban,
            type: account.type,
            icon: account.icon,
            title: account.title,
            currentBalance: balance,
            instrumentId: account.instrumentId,
            includeInNetWorth: account.includeInNetWorth,
            isActive: account.isActive
        },
        async values =>
            await accountService.updateById(account.id, {
                externalId: values.externalId,
                iban: values.iban,
                icon: values.icon,
                title: values.title,
                currentBalance: values.currentBalance,
                instrumentId: values.instrumentId,
                includeInNetWorth: values.includeInNetWorth,
                isActive: values.isActive
            })
    );

    const accountTypeVariant = ACCOUNT_COLOR[account.type];
    const isBankSyncAccount = account.type === AccountTypeEnum.BANK_SYNC;

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountScreen
            instrumentSymbol={instrument.symbol}
            onSubmit={handleSubmit}
            account={account}
            control={control}
            allowNegativeBalance
        >
            <FormItem label={t`Account Type`}>
                <View className="flex-row items-center rounded-2xl bg-secondary-background p-xl">
                    <View className="flex-row items-center gap-x-lg">
                        <CircleIcon icon={ACCOUNT_ICON[account.type]} variant={accountTypeVariant} size={40} iconSize={18} border={false} />
                        <Text className="text-primary text-base font-medium">{t(ACCOUNT_TYPE[account.type])}</Text>
                    </View>
                </View>
            </FormItem>
            {isBankSyncAccount ? <AccountBankSyncCard accountId={account.id} /> : null}
            <IncludeInNetWorthField control={control} />
        </UpdateAccountScreen>
    );
};
