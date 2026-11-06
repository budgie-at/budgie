import { BudgetAlertKindEnum, BudgetAlertScopeEnum } from '@budgie/budget';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useAuthContext } from '../../../auth/context/auth.context';
import { RecurringNotificationKindEnum } from '../../../recurring/enum/recurring-notification-kind.enum';

const decodeNotificationData = Schema.decodeUnknownOption(
    Schema.Union([
        Schema.Struct({
            kind: Schema.Literal(RecurringNotificationKindEnum.RECURRING),
            seriesId: Schema.Finite
        }),
        Schema.Struct({
            kind: Schema.Literal(BudgetAlertKindEnum.PACE),
            scope: Schema.Enum(BudgetAlertScopeEnum),
            categoryId: Schema.NullOr(Schema.Finite)
        })
    ])
);

export const BudgetNotificationLaunchHandler = () => {
    const { isUnlocked } = useAuthContext();
    const lastResponse = Notifications.useLastNotificationResponse();

    const handleResponse = useEffectEvent((data: unknown) => {
        Option.match(decodeNotificationData(data), {
            onNone: emptyFn,
            onSome: payload => {
                Notifications.clearLastNotificationResponse();

                if (payload.kind === RecurringNotificationKindEnum.RECURRING) {
                    router.push({ pathname: '/recurring/[id]', params: { id: String(payload.seriesId) } });

                    return;
                }

                router.push({
                    pathname: '/budget',
                    params: { scope: payload.scope, ...(isDefined(payload.categoryId) && { categoryId: String(payload.categoryId) }) }
                });
            }
        });
    });

    useEffect(() => {
        if (isUnlocked && isDefined(lastResponse)) {
            handleResponse(lastResponse.notification.request.content.data);
        }
    }, [isUnlocked, lastResponse]);

    return null;
};
