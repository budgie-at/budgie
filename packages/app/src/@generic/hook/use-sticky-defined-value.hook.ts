import { useState } from 'react';

import { Maybe, isDefined } from '@rnw-community/shared';

export const useStickyDefinedValue = <Value>(value: Maybe<Value>): Maybe<Value> => {
    const [lastDefinedValue, setLastDefinedValue] = useState(value);

    if (isDefined(value) && value !== lastDefinedValue) {
        setLastDefinedValue(value);
    }

    return isDefined(value) ? value : lastDefinedValue;
};
