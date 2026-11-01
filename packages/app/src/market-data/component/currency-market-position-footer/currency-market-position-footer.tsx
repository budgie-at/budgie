import { convertToMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

import type { CryptoPositionInterface } from '@budgie/market';

interface Props {
    readonly position: CryptoPositionInterface;
    readonly balance: number;
    readonly instrumentCode: string;
}

export const CurrencyMarketPositionFooter = ({ position, balance, instrumentCode }: Props) => {
    const formatCrypto = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    const hasKnownCost = isDefined(position.costBasis);
    const isPartiallyCovered = convertToMicroUnits(position.amount) < convertToMicroUnits(balance);
    const coveredAmount = formatCrypto(position.amount);
    const totalAmount = `${formatCrypto(balance)} ${instrumentCode}`;

    if (hasKnownCost && !isPartiallyCovered) {
        return null;
    }

    return (
        <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
            {hasKnownCost ? (
                <Trans>
                    Return covers {coveredAmount} of {totalAmount} with a known purchase price.
                </Trans>
            ) : (
                <Trans>No purchase price is recorded for this balance, so the return can’t be calculated.</Trans>
            )}
        </Text>
    );
};
