import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isNotEmptyString } from '@rnw-community/shared';

import { Input } from '../../../@generic/component/input/input';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';

import type { EmptyFn } from '@rnw-community/shared';
import type { NativeSyntheticEvent, TextInputSubmitEditingEventData } from 'react-native';

interface Props {
    readonly seriesId: number;
    readonly title: string;
    readonly onDone: EmptyFn;
}

export const RecurringSeriesTitleInput = ({ seriesId, title, onDone }: Props) => {
    const { t } = useLingui();

    const handleSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
        const nextTitle = event.nativeEvent.text.trim();
        if (isNotEmptyString(nextTitle) && nextTitle !== title) {
            appRuntime.runFork(
                logAndContinue(
                    Effect.flatMap(RecurringService, recurringService => recurringService.rename(seriesId, nextTitle)).pipe(
                        toastOnFailure(t`Could not rename recurring payment.`)
                    )
                )
            );
        }
        onDone();
    };

    return <Input autoFocus defaultValue={title} returnKeyType="done" onSubmitEditing={handleSubmit} onBlur={onDone} />;
};
