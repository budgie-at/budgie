import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { InstitutionMark } from '../institution-mark/institution-mark';

import type { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountWithSyncEntityInterface, 'type' | 'title' | 'icon' | AccountAssociationEnum.INSTRUMENT>;
    readonly provider: ExternalSourceEnum;
}

export const InstitutionAccountLeading = ({ account, provider }: Props) => {
    if (account.type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoCurrencyIcon code={account.instrument.code} size={44} className="bg-surface-disc" />;
    }

    if (provider !== ExternalSourceEnum.INZHUR) {
        return <InstitutionMark provider={provider} title={account.title} />;
    }

    return <NeutralIconTile icon={account.icon} />;
};
