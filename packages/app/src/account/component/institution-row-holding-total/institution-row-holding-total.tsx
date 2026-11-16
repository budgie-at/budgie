import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { HomeAmountColumn } from '../home-amount-column/home-amount-column';
import { HomeAmountValue } from '../home-amount-value/home-amount-value';
import { HomeReturnSlot } from '../home-return-slot/home-return-slot';
import { InstitutionRowSelector } from '../institution-row/institution-row.selector';

interface Props {
    readonly integrationId: number;
    readonly total: number;
    readonly returnPercent: number | undefined;
    readonly isReturnPending: boolean;
    readonly isReturnSuppressed: boolean;
}

const PLACEHOLDER_PERCENT = 0.9999;

export const InstitutionRowHoldingTotal = ({ integrationId, total, returnPercent, isReturnPending, isReturnSuppressed }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const isReturnEmpty = !isReturnPending && !isDefined(returnPercent);

    return (
        <HomeAmountColumn>
            <HomeAmountValue amount={total} testID={InstitutionRowSelector.Total(integrationId)} />
            <HomeReturnSlot isSuppressed={isReturnSuppressed} isPending={isReturnPending} isEmpty={isReturnEmpty}>
                <BrokerageReturnText
                    gain={null}
                    percent={returnPercent ?? PLACEHOLDER_PERCENT}
                    instrumentSymbol={defaultInstrument.symbol}
                    maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                />
            </HomeReturnSlot>
        </HomeAmountColumn>
    );
};
