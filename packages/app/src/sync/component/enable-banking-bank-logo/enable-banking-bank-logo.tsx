import { ExternalSourceEnum } from '@budgie/contracts';
import { Image } from 'expo-image';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';

interface Props {
    readonly logoUrl: string | null;
}

const LOGO_SIZE = 36;
const LOGO_STYLE = { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 10 } as const;

export const EnableBankingBankLogo = ({ logoUrl }: Props) => {
    const [hasFailed, setHasFailed] = useState(false);

    const handleError = () => {
        setHasFailed(true);
    };

    if (!isNotEmptyString(logoUrl) || hasFailed) {
        return <BankLogo bankProvider={ExternalSourceEnum.ENABLE_BANKING} size={LOGO_SIZE} />;
    }

    const source = { uri: logoUrl };

    return <Image source={source} style={LOGO_STYLE} contentFit="contain" onError={handleError} />;
};
