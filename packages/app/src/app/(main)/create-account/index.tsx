import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { CreateAccountCard } from '../../../account/component/create-account-card/create-account-card';
import { CreateSyncCard } from '../../../account/component/create-sync-card/create-sync-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';

export default function Index() {
    const { t } = useLingui();

    return (
        <CollapsibleChromePage title={t`New Account`} leading={<HeaderBackButton />} contentClassName="gap-y-xl pb-5xl">
            <CreateAccountCard
                description={t`Everyday transactions and spending`}
                icon={ACCOUNT_ICON.BANK}
                title={t`Checking Account`}
                type={AccountTypeEnum.BANK}
            />
            <CreateAccountCard
                description={t`Emergency fund and savings goals`}
                icon={ACCOUNT_ICON.CASH}
                title={t`Savings Account`}
                type={AccountTypeEnum.CASH}
            />
            <CreateAccountCard
                description={t`Cold wallets and exchange balances`}
                icon={ACCOUNT_ICON.CRYPTO}
                title={t`Crypto Account`}
                type={AccountTypeEnum.CRYPTO}
            />
            <CreateAccountCard
                description={t`Money lent or borrowed`}
                icon={ACCOUNT_ICON.DEBT}
                title={t`Debt Account`}
                type={AccountTypeEnum.DEBT}
            />
            <CreateAccountCard
                description={t`Fixed-term savings with an interest rate`}
                icon={ACCOUNT_ICON.DEPOSIT}
                title={t`Deposit Account`}
                type={AccountTypeEnum.DEPOSIT}
            />

            <Text className="text-secondary-foreground text-sm px-md mt-xl">
                <Trans>Account Sync</Trans>
            </Text>

            <CreateSyncCard
                description={t`Auto-sync accounts and transactions from Monobank`}
                title={t`Monobank`}
                bankProvider={ExternalSourceEnum.MONOBANK}
            />
            <CreateSyncCard
                description={t`Import accounts and transactions from Privatbank XLSX export`}
                title={t`Privatbank`}
                bankProvider={ExternalSourceEnum.PRIVATBANK}
            />
            <CreateSyncCard
                description={t`Import accounts and transactions from Erste Bank PDF statement`}
                title={t`Erste Bank`}
                bankProvider={ExternalSourceEnum.ERSTE}
            />
            <CreateSyncCard
                description={t`Sync crypto balances and transactions from Binance with a read-only API key`}
                title={t`Binance`}
                bankProvider={ExternalSourceEnum.BINANCE}
            />

            <MenuSpacer />
        </CollapsibleChromePage>
    );
}
