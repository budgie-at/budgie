import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { CreateAccountCard } from '../../../account/component/create-account-card/create-account-card';
import { CreateSyncCard } from '../../../account/component/create-sync-card/create-sync-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';
import { ACCOUNT_KIND_TITLE } from '../../../account/constant/account-kind-title.constant';

export default function Index() {
    const { t } = useLingui();

    return (
        <CollapsibleChromePage title={t`New Account`} leading={<HeaderBackButton />} contentClassName="gap-y-7xl pb-5xl">
            <GroupedListSection title={t`Track manually`}>
                <CreateAccountCard
                    description={t`Cards and everyday spending`}
                    icon={ACCOUNT_ICON.BANK}
                    title={t(ACCOUNT_KIND_TITLE[AccountTypeEnum.BANK])}
                    type={AccountTypeEnum.BANK}
                />
                <CreateAccountCard
                    description={t`Cash wallets and savings goals`}
                    icon={ACCOUNT_ICON.CASH}
                    title={t(ACCOUNT_KIND_TITLE[AccountTypeEnum.CASH])}
                    type={AccountTypeEnum.CASH}
                />
                <CreateAccountCard
                    description={t`Wallets and exchange balances`}
                    icon={ACCOUNT_ICON.CRYPTO}
                    title={t(ACCOUNT_KIND_TITLE[AccountTypeEnum.CRYPTO])}
                    type={AccountTypeEnum.CRYPTO}
                />
                <CreateAccountCard
                    description={t`Money you lent or borrowed`}
                    icon={ACCOUNT_ICON.DEBT}
                    title={t(ACCOUNT_KIND_TITLE[AccountTypeEnum.DEBT])}
                    type={AccountTypeEnum.DEBT}
                />
                <CreateAccountCard
                    description={t`Fixed-term savings with interest`}
                    icon={ACCOUNT_ICON.DEPOSIT}
                    title={t(ACCOUNT_KIND_TITLE[AccountTypeEnum.DEPOSIT])}
                    type={AccountTypeEnum.DEPOSIT}
                />
            </GroupedListSection>

            <GroupedListSection title={t`Sync or import`} footer={t`Tokens and statements stay on this device.`}>
                <CreateSyncCard
                    description={t`Automatic sync with a personal token`}
                    title={t`Monobank`}
                    bankProvider={ExternalSourceEnum.MONOBANK}
                />
                <CreateSyncCard
                    description={t`Import an XLSX statement`}
                    title={t`Privatbank`}
                    bankProvider={ExternalSourceEnum.PRIVATBANK}
                />
                <CreateSyncCard description={t`Import a PDF statement`} title={t`Erste Bank`} bankProvider={ExternalSourceEnum.ERSTE} />
                <CreateSyncCard
                    description={t`Sync with a read-only API key`}
                    title={t`Binance`}
                    bankProvider={ExternalSourceEnum.BINANCE}
                />
            </GroupedListSection>

            <MenuSpacer />
        </CollapsibleChromePage>
    );
}
