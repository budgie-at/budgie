import { CurrencyEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../../../@generic/components/circle-icon/circle-icon';
import { EmptyScreen } from '../../../../../@generic/components/empty-screen/empty-screen';
import { HapticPressable } from '../../../../../@generic/components/haptic-pressable/haptic-pressable';
import { Page } from '../../../../../@generic/components/page/page';
import { PageHeader } from '../../../../../@generic/components/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../../../@generic/constant/icons.constant';
import { IdParamInterface } from '../../../../../@generic/interface/id-param.interface';
import { isEnumValue } from '../../../../../@generic/type-guard/is-enum-value.type-guard';
import { AccountBalance } from '../../../../../account/component/account-balance/account-balance';
import { ACCOUNT_COLOR } from '../../../../../account/constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../../../settings/context/settings.context';
import { TransactionList } from '../../../../../transaction/components/transaction-list/transaction-list';

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
                    showBackBtn
                    title={title}
                    iconVariant={variant}
                    right={
                        <Link href={`/home/account/${id}/update`} asChild>
                            <HapticPressable className="ml-auto">
                                <CircleIcon icon={ICONS.EllipsisVertical} variant="ghost" size="lg" border={false} />
                            </HapticPressable>
                        </Link>
                    }
                    description={i18n.t(ACCOUNT_TYPE[type])}
                    descriptionClassName={descriptionVariants({ variant })}
                />
            }
            contentClassName="px-0 flex-1"
        >
            <View className="py-[30px]">
                <AccountBalance currency={currency} balance={balance} />
            </View>

            <TransactionList accountId={id} />
        </Page>
    );
}
