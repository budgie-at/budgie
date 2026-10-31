import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics';
import { useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { MAX_INSTALLMENT_COUNT } from '../constant/convert-to-installment-form-schema.constant';

const WHOLE_NUMBER_PATTERN = /^\d+$/u;

export const useInstallmentCountDraft = (selectedCount: number, lowestCount: number, onSelect: (count: number) => void) => {
    const { t } = useLingui();
    const [draft, setDraft] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const draftRef = useRef<string | null>(null);
    const [hapticNotification] = useVibration();

    const isCountInRange = (text: string) =>
        WHOLE_NUMBER_PATTERN.test(text) && Number(text) >= lowestCount && Number(text) <= MAX_INSTALLMENT_COUNT;

    const updateDraft = (text: string | null) => {
        draftRef.current = text;
        setDraft(text);
    };

    const commit = (text: string | null) => {
        updateDraft(null);

        if (!isDefined(text) || !WHOLE_NUMBER_PATTERN.test(text)) {
            return;
        }

        const clampedCount = Math.min(Math.max(Number(text), lowestCount), MAX_INSTALLMENT_COUNT);
        const isClamped = clampedCount !== Number(text);

        setNotice(isClamped ? t({ message: plural(clampedCount, { one: 'Set to # month', other: 'Set to # months' }) }) : null);

        if (isClamped) {
            hapticNotification(NotificationFeedbackType.Warning);
        }

        onSelect(clampedCount);
    };

    const handleChangeText = (text: string) => {
        updateDraft(text);
        setNotice(null);

        if (isCountInRange(text)) {
            onSelect(Number(text));
        }
    };

    const handleFocus = () => {
        setNotice(null);
        updateDraft(String(selectedCount));
    };

    const handleBlur = () => {
        commit(draftRef.current);
    };

    return {
        draft,
        notice,
        isDraftValid: !isDefined(draft) || isCountInRange(draft),
        commit,
        handleChangeText,
        handleFocus,
        handleBlur
    };
};
