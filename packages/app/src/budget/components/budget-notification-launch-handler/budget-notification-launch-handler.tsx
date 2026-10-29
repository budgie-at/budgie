import { BudgetAlertKindEnum, BudgetAlertScopeEnum } from '@budgie/budget';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useAuthContext } from '../../../auth/context/auth.context';

const decodePaceNotificationData = Schema.decodeUnknownOption(
    Schema.Struct({
        kind: Schema.Literal(BudgetAlertKindEnum.PACE),
        scope: Schema.Enum(BudgetAlertScopeEnum),
        categoryId: Schema.NullOr(Schema.Number)
    })
);

export const BudgetNotificationLaunchHandler = () => {
    const { isUnlocked } = useAuthContext();
    const lastResponse = Notifications.useLastNotificationResponse();

    const handleResponse = useEffectEvent((data: unknown) => {
        Option.match(decodePaceNotificationData(data), {
            onNone: emptyFn,
            onSome: ({ scope, categoryId }) => {
                Notifications.clearLastNotificationResponse();
                router.push({
                    pathname: '/budget',
                    params: { scope, ...(isDefined(categoryId) && { categoryId: String(categoryId) }) }
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
