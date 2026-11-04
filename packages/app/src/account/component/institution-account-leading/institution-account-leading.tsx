import { AccountTypeEnum, ExternalSourceEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { InstitutionMark } from '../institution-mark/institution-mark';

import type { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountWithSyncEntityInterface, 'type' | 'title' | AccountAssociationEnum.INSTRUMENT>;
    readonly provider: ExternalSourceEnum;
}

export const InstitutionAccountLeading = ({ account, provider }: Props) => {
    if (account.type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoCurrencyIcon code={account.instrument.code} size={44} className="bg-surface-disc" />;
    }

    if (provider !== ExternalSourceEnum.INZHUR) {
        return <InstitutionMark provider={provider} title={account.title} />;
    }

    const icon = account.instrument.type === InstrumentTypeEnum.FUND ? UserIconNameEnum.ChartLine : UserIconNameEnum.Banknote;

    return (
        <CircleIcon
            icon={icon}
            size={44}
            iconSize={22}
            radius={11}
            variant="ghost"
            border={false}
            className="bg-surface-disc"
            iconClassName="text-primary"
        />
    );
};
