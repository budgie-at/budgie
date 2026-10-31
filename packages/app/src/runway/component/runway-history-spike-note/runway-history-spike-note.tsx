import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { RUNWAY_FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/runway-footnote-max-font-size-multiplier.constant';
import { useRunwayAmountLabel } from '../../hook/use-runway-amount-label.hook';

interface Props {
    readonly spikeLabel: string;
    readonly expense: number;
}

export const RunwayHistorySpikeNote = ({ spikeLabel, expense }: Props) => {
    const formatAmount = useRunwayAmountLabel();

    const spikeAmount = formatAmount(expense);

    return (
        <Text
            maxFontSizeMultiplier={RUNWAY_FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className="px-3xl text-[13px] tabular-nums text-secondary-foreground"
        >
            <Trans>
                {spikeLabel} included a one-off of {spikeAmount}.
            </Trans>
        </Text>
    );
};
