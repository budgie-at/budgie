import { BudgetAlertScopeEnum } from '@budgie/budget';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useReducedMotion } from '../../@generic/hook/use-reduced-motion.hook';

import type { BudgetHighlightTargetInterface } from '../interface/budget-highlight-target.interface';
import type { View } from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

const REVEAL_TOP_MARGIN = 16;
const decodeHighlightParams = Schema.decodeUnknownOption(
    Schema.Struct({ scope: Schema.Enum(BudgetAlertScopeEnum), categoryId: Schema.optionalKey(Schema.NumberFromString) })
);

export const useBudgetDetailsReveal = (isLoading: boolean) => {
    const reducedMotion = useReducedMotion();
    const searchParams = useLocalSearchParams();
    const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
    const contentRef = useRef<View>(null);
    const [highlightTarget, setHighlightTarget] = useState<BudgetHighlightTargetInterface | null>(() =>
        Option.getOrNull(decodeHighlightParams(searchParams))
    );

    const handleReveal = (view: View) => {
        if (!isDefined(contentRef.current)) {
            return;
        }

        view.measureLayout(
            contentRef.current,
            (_left, top) => {
                scrollRef.current?.scrollTo({ y: Math.max(top - REVEAL_TOP_MARGIN, 0), animated: !reducedMotion });
                setHighlightTarget(null);
            },
            emptyFn
        );
    };

    return {
        scrollRef,
        contentRef,
        setHighlightTarget,
        highlightContextValue: { target: isLoading ? null : highlightTarget, reveal: handleReveal }
    };
};
