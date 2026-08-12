import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../../@generic/component/haptic-pressable/haptic-pressable';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { Page } from '../../../../@generic/component/page/page';
import { FOREGROUND_COLOR_PALETTE } from '../../../../@generic/constant/foreground-color-palette.constant';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { AccountBalance } from '../../../../account/component/account-balance/account-balance';
import { AccountDetailsMenuControls } from '../../../../account/component/account-details-menu-controls/account-details-menu-controls';
import { DebtAccountBalance } from '../../../../account/component/debt-account-balance/debt-account-balance';
import { DepositAccountActionsMenu } from '../../../../account/component/deposit-account-actions-menu/deposit-account-actions-menu';
import { DepositDetailsCard } from '../../../../account/component/deposit-details-card/deposit-details-card';
import { ACCOUNT_COLOR } from '../../../../account/constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useDebtAccountProgressSummaryQuery } from '../../../../account/query/use-debt-account-progress-summary.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { TransactionList } from '../../../../transaction/components/transaction-list/transaction-list';

import { AccountDetailsSelector } from './account-details.selector';

const descriptionVariants = cva('uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export default function AccountDetails() {
    const id = Number(useLocalSearchParams<IdParamInterface>().id);

    const router = useRouter();
    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { balance } = useAccountBalanceQuery(id);
    const debtProgressSummary = useDebtAccountProgressSummaryQuery(id);
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');
    const handleOpenAccountSettings = () => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(id) } });

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    const accountVariant = ACCOUNT_COLOR[account.type];
    const headerRight =
        account.type === AccountTypeEnum.DEPOSIT ? (
            <DepositAccountActionsMenu accountId={id} balance={balance} instrumentSymbol={account.instrument.symbol} />
        ) : (
            <HapticPressable
                className="ml-auto h-10 w-10 items-center justify-center"
                onPress={handleOpenAccountSettings}
                testID={AccountDetailsSelector.EditButton}
                nativeID={AccountDetailsSelector.EditButton}
                collapsable={false}
                accessibilityRole="button"
            >
                <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
            </HapticPressable>
        );

    return (
        <View className="relative flex-1">
            <Page
                testID={AccountDetailsSelector.Page}
                header={
                    <PageHeader
                        icon={account.icon}
                        onGoBack={handleGoBack}
                        title={account.title}
                        iconVariant={accountVariant}
                        right={headerRight}
                        description={t(ACCOUNT_TYPE[account.type])}
                        descriptionClassName={descriptionVariants({ variant: accountVariant })}
                    />
                }
                contentClassName="px-0 flex-1"
            >
                <View className="pb-md">
                    {account.type === AccountTypeEnum.DEBT ? (
                        <DebtAccountBalance
                            debtType={account.debtType}
                            instrumentSymbol={account.instrument.symbol}
                            summary={debtProgressSummary}
                        />
                    ) : (
                        <AccountBalance instrumentSymbol={account.instrument.symbol} balance={balance} />
                    )}

                    {account.type === AccountTypeEnum.DEPOSIT ? (
                        <DepositDetailsCard
                            balance={balance}
                            instrumentSymbol={account.instrument.symbol}
                            interestRate={account.interestRate}
                            deadline={account.deadline}
                        />
                    ) : null}
                </View>

                <TransactionList accountId={id} footerSpacerMultiplier={3} />
            </Page>

            <AccountDetailsMenuControls accountId={id} accountType={account.type} />
        </View>
    );
}
