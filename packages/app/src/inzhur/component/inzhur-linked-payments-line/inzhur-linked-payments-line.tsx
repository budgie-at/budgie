import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { inzhurLinkedPaymentsAtom } from '../../constant/inzhur-linked-payments-atom.constant';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurLinkedPaymentsLine = () => {
    const { t } = useLingui();
    const linkedCount = useAtomValue(inzhurLinkedPaymentsAtom);

    if (!isPositiveNumber(linkedCount)) {
        return null;
    }

    const label = t({
        message: plural(linkedCount, {
            one: 'Linked # past Inzhur payment from your bank',
            other: 'Linked # past Inzhur payments from your bank'
        })
    });

    return (
        <Text className="text-center text-[13px] leading-[18px] text-secondary-foreground" testID={InzhurSelector.LinkedPayments}>
            {label}
        </Text>
    );
};
