import { AccountTypeEnum, CurrencyEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../../@generic/component/circle-icon/circle-icon';
import { EmptyScreen } from '../../../../@generic/component/empty-screen/empty-screen';
import { HapticPressable } from '../../../../@generic/component/haptic-pressable/haptic-pressable';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../../@generic/constant/foreground-color-palette.constant';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { isEnumValue } from '../../../../@generic/type-guard/is-enum-value.type-guard';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { AccountBalance } from '../../../../account/component/account-balance/account-balance';
import { DebtAccountBalance } from '../../../../account/component/debt-account-balance/debt-account-balance';
import { ACCOUNT_COLOR } from '../../../../account/constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { TransactionList } from '../../../../transaction/components/transaction-list/transaction-list';

const descriptionVariants = cva('uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export default function Account() {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { balance } = useAccountBalanceQuery(id);
    const { defaultCurrency } = useSettingsContext();
    const { i18n } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    const { title, icon, type, instrument } = account;
    const currency = isEnumValue(instrument.code, CurrencyEnum) ? instrument.code : defaultCurrency;

    const variant = ACCOUNT_COLOR[type];

    return (
        <Page
            header={
                <PageHeader
                    icon={icon}
                    onGoBack={handleGoBack}
                    title={title}
                    iconVariant={variant}
                    right={
                        <Link href={`/account/${id}/update`} asChild>
                            <HapticPressable className="ml-auto">
                                <CircleIcon icon="EllipsisVertical" variant="ghost" size={40} iconSize={24} border={false} />
                            </HapticPressable>
                        </Link>
                    }
                    description={i18n.t(ACCOUNT_TYPE[type])}
                    descriptionClassName={descriptionVariants({ variant })}
                />
            }
            contentClassName="px-0 flex-1"
        >
            <View className="pb-7.5">
                {type === AccountTypeEnum.DEBT ? (
                    <DebtAccountBalance balance={balance} currency={currency} targetAmount={account.targetBalance} />
                ) : (
                    <AccountBalance currency={currency} balance={balance} />
                )}
            </View>

            <TransactionList accountId={id} />
        </Page>
    );
}
