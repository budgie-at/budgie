import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BrokerageReturnText } from '../brokerage-return-text/brokerage-return-text';

interface Props {
    readonly caption: string;
    readonly gain: number | null;
    readonly instrumentSymbol: string;
}

export const BrokerageHoldingCaption = ({ caption, gain, instrumentSymbol }: Props) => (
    <>
        {caption}
        {isDefined(gain) ? (
            <Text>
                {' · '}
                <BrokerageReturnText gain={gain} percent={null} instrumentSymbol={instrumentSymbol} />
            </Text>
        ) : null}
    </>
);
