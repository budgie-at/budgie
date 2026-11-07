import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect } from 'react';
import { AccessibilityInfo, Text } from 'react-native';

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
    const { preview } = useAdjustmentBalance(details, amount, isIncrease);

    useEffect(() => {
        const fiber = appRuntime.runFork(
            Effect.sleep(600).pipe(
                Effect.andThen(Effect.sync(() => void AccessibilityInfo.announceForAccessibilityWithOptions(preview, { queue: true })))
            )
        );

        return () => void appRuntime.runFork(Fiber.interrupt(fiber));
    }, [preview]);

    return (
        <Text
            accessible
            accessibilityLiveRegion="polite"
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
