import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CreateLiabilityAccount } from '../create-liability-account/create-liability-account';

export const CreateCryptoAccount = () => {
    const { t } = useLingui();

    return (
        <CreateLiabilityAccount
            type={AccountTypeEnum.CRYPTO}
            title={t`Crypto Account`}
            allowNegative={false}
            defaultIcon={UserIconNameEnum.Coins}
            instrumentType={InstrumentTypeEnum.CRYPTO}
        />
    );
};
