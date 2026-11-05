import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';

import type { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountWithSyncEntityInterface, 'type' | 'title' | 'icon' | AccountAssociationEnum.INSTRUMENT>;
    readonly provider: ExternalSourceEnum;
    readonly bankName: string | null;
}

export const InstitutionAccountLeading = ({ account, provider, bankName }: Props) => {
    if (account.type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoCurrencyIcon code={account.instrument.code} size={44} className="bg-surface-disc" />;
    }

    if (provider !== ExternalSourceEnum.INZHUR) {
        return <BankLogo bankProvider={provider} bankName={bankName ?? account.title} size={44} />;
    }

    return <NeutralIconTile icon={account.icon} />;
};
