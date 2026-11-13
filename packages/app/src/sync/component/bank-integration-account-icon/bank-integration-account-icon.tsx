import { AccountWithInstrumentEntityInterface, ExternalSourceEnum, UserIconType } from '@budgie/contracts';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { useBankIntegration } from '../../context/bank-integration.context';

interface Props {
    readonly icon: UserIconType;
    readonly instrument: Pick<AccountWithInstrumentEntityInterface['instrument'], 'code' | 'symbol' | 'type'>;
}

export const BankIntegrationAccountIcon = ({ icon, instrument }: Props) => {
    const { integration, capabilities } = useBankIntegration();

    if (capabilities.supportsFileImport || integration.provider === ExternalSourceEnum.ENABLE_BANKING) {
        return <BankLogo bankProvider={integration.provider} size={36} bankName={integration.label} />;
    }

    if (isListedSecurityType(instrument.type)) {
        return <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={36} />;
    }

    return (
        <CircleIcon
            icon={icon}
            variant="primary"
            size={36}
            iconSize={18}
            radius={18}
            border={false}
            className={TONAL_DISC_BACKGROUND.primary}
        />
    );
};
