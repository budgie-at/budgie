import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../../@generic/component/haptic-pressable/haptic-pressable';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../../@generic/constant/foreground-color-palette.constant';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { AccountBalance } from '../../../../account/component/account-balance/account-balance';
import { AccountDetailsMenuControls } from '../../../../account/component/account-details-menu-controls/account-details-menu-controls';
import { DebtAccountBalance } from '../../../../account/component/debt-account-balance/debt-account-balance';
import { ACCOUNT_COLOR } from '../../../../account/constant/account-color.constant';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../../../account/constant/account-debt-type-color.constant';
import { ACCOUNT_TYPE } from '../../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useDebtAccountLedgerTotalsQuery } from '../../../../account/query/use-debt-account-ledger-totals.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { TransactionList } from '../../../../transaction/components/transaction-list/transaction-list';

import { AccountDetailsSelector } from './account-details.selector';

const descriptionVariants = cva('uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export default function AccountDetails() {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { balance } = useAccountBalanceQuery(id);
    const { debitAmount, creditAmount } = useDebtAccountLedgerTotalsQuery(id);
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    const { title, icon, type, instrument, debtType } = account;
    const accountVariant = type === AccountTypeEnum.DEBT ? ACCOUNT_DEBT_TYPE_COLOR[debtType] : ACCOUNT_COLOR[type];

    return (
        <View className="relative flex-1">
            <Page
                header={
                    <PageHeader
                        icon={icon}
                        onGoBack={handleGoBack}
                        title={title}
                        iconVariant={accountVariant}
                        right={
                            <Link href={`/account/${id}/update`} asChild>
                                <HapticPressable className="ml-auto" testID={AccountDetailsSelector.EditButton}>
                                    <CircleIcon
                                        icon={UserIconNameEnum.EllipsisVertical}
                                        variant="ghost"
                                        size={40}
                                        iconSize={24}
                                        border={false}
                                    />
                                </HapticPressable>
                            </Link>
                        }
                        description={t(ACCOUNT_TYPE[type])}
                        descriptionClassName={descriptionVariants({ variant: accountVariant })}
                    />
                }
                contentClassName="px-0 flex-1"
            >
                <View className="pb-md">
                    {type === AccountTypeEnum.DEBT ? (
                        <DebtAccountBalance
                            balance={balance}
                            creditAmount={creditAmount}
                            debitAmount={debitAmount}
                            debtType={debtType}
                            instrumentSymbol={instrument.symbol}
                            targetAmount={convertFromMicroUnits(account.targetBalance)}
                        />
                    ) : (
                        <AccountBalance instrumentSymbol={instrument.symbol} balance={balance} />
                    )}
                </View>

                <TransactionList accountId={id} footerSpacerMultiplier={3} />
            </Page>

            <AccountDetailsMenuControls accountId={id} />
        </View>
    );
}
