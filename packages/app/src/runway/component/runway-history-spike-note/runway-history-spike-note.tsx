import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly spikeLabel: string;
    readonly expense: number;
}

export const RunwayHistorySpikeNote = ({ spikeLabel, expense }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);

    const spikeAmount = formatDigits(convertFromMicroUnits(expense), defaultInstrument.symbol);

    return (
        <Text className="text-xs tabular-nums text-secondary-foreground">
            <Trans>
                {spikeLabel} had a one-off {spikeAmount}. The estimate uses a typical month instead.
            </Trans>
        </Text>
    );
};
