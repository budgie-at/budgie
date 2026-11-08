import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useAdjustmentBalance } from '../../hook/use-adjustment-balance.hook';
import { AdjustmentSelector } from '../adjustment-account-summary/adjustment-account-summary.selector';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
    readonly amount: number;
    readonly isIncrease: boolean;
}

const PREVIEW_STYLE = { height: 24 };

export const AdjustmentBalancePreview = ({ details, amount, isIncrease }: Props) => {
    const { t } = useLingui();
    const { preview, announcement, resultingBalance } = useAdjustmentBalance(details, amount, isIncrease);

    const previousPreview = useRef(announcement);
    const accessibilityLabel = isDefined(resultingBalance) ? announcement : t`Balance after saving`;
    const accessibilityValue = isDefined(resultingBalance) ? void 0 : { text: t`Not set` };

    useEffect(() => {
        const hasChanged = previousPreview.current !== announcement;
        previousPreview.current = announcement;

        if (!hasChanged || Platform.OS !== 'ios') {
            return;
        }

        const fiber = appRuntime.runFork(
            Effect.sleep(600).pipe(
                Effect.andThen(Effect.sync(() => void AccessibilityInfo.announceForAccessibilityWithOptions(announcement, { queue: true })))
            )
        );

        return () => void appRuntime.runFork(Fiber.interrupt(fiber));
    }, [announcement]);

    return (
        <Text
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={accessibilityValue}
            className="min-w-0 flex-1 text-center text-[13px] text-secondary-foreground"
            style={PREVIEW_STYLE}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            testID={AdjustmentSelector.Preview}
        >
            {preview}
        </Text>
    );
};
