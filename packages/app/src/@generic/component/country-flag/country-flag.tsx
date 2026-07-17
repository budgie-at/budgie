import { LanguageEnum } from '@budgie/contracts';
import { ReactElement } from 'react';

import { DeFlagIcon } from './icons/de-flag-icon';
import { EsFlagIcon } from './icons/es-flag-icon';
import { FrFlagIcon } from './icons/fr-flag-icon';
import { UaFlagIcon } from './icons/ua-flag-icon';
import { UsFlagIcon } from './icons/us-flag-icon';

interface Props {
    readonly language: LanguageEnum;
    readonly size?: number;
}

const getFlagIcon = (language: LanguageEnum, size: number): ReactElement => {
    switch (language) {
        case LanguageEnum.FR:
            return <FrFlagIcon size={size} />;
        case LanguageEnum.UK:
            return <UaFlagIcon size={size} />;
        case LanguageEnum.DE:
            return <DeFlagIcon size={size} />;
        case LanguageEnum.ES:
            return <EsFlagIcon size={size} />;
        case LanguageEnum.EN:
        default:
            return <UsFlagIcon size={size} />;
    }
};

export const CountryFlag = ({ language, size = 20 }: Props) => getFlagIcon(language, size);
