import { ExternalSourceEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { RuleConditionValueEnumSelector } from '../rule-condition-value-enum-selector/rule-condition-value-enum-selector';

interface Props {
    readonly index: number;
}

const EXTERNAL_SOURCE_OPTIONS = [
    { value: ExternalSourceEnum.MANUAL, label: msg`Manual` },
    { value: ExternalSourceEnum.MONOBANK, label: msg`Monobank` },
    { value: ExternalSourceEnum.PRIVATBANK, label: msg`Privatbank` },
    { value: ExternalSourceEnum.REVOLUT, label: msg`Revolut` },
    { value: ExternalSourceEnum.BINANCE, label: msg`Binance` },
    { value: ExternalSourceEnum.COINBASE, label: msg`Coinbase` },
    { value: ExternalSourceEnum.WISE, label: msg`Wise` },
    { value: ExternalSourceEnum.CSV, label: msg`CSV` }
];

export const RuleConditionExternalSourceSelector = ({ index }: Props) => {
    const { t } = useLingui();

    return (
        <RuleConditionValueEnumSelector
            index={index}
            options={EXTERNAL_SOURCE_OPTIONS}
            sheetTitle={t`Select External Source`}
            defaultLabel={t`Select source`}
        />
    );
};
