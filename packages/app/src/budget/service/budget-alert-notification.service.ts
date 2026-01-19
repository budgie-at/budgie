import { BudgetAlertEntityInterface, BudgetAlertSeverityEnum, BudgetAlertTypeEnum } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { PermissionStatus } from 'expo-notifications';
import * as Notifications from 'expo-notifications';

import { isDefined } from '@rnw-community/shared';

interface NotificationContentInterface {
    readonly title: string;
    readonly body: string;
}

class BudgetAlertNotificationService {
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === PermissionStatus.GRANTED) {
            return true;
        }

        const { status } = await Notifications.requestPermissionsAsync();

        return status === PermissionStatus.GRANTED;
    }

    async sendAlertNotification(alert: BudgetAlertEntityInterface, categoryName?: string): Promise<void> {
        const hasPermission = await this.hasPermission();

        if (!hasPermission) {
            return;
        }

        const { title, body } = this.getNotificationContent(alert, categoryName);

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: { alertId: alert.id, budgetId: alert.budgetId }
            },
            trigger: null
        });
    }

    private async hasPermission(): Promise<boolean> {
        const { status } = await Notifications.getPermissionsAsync();

        return status === PermissionStatus.GRANTED;
    }

    private getNotificationContent(alert: BudgetAlertEntityInterface, categoryName?: string): NotificationContentInterface {
        const target = isDefined(categoryName) ? categoryName : i18n.t(msg`overall budget`);
        const { percentage } = alert;

        if (alert.type === BudgetAlertTypeEnum.THRESHOLD) {
            if (alert.severity === BudgetAlertSeverityEnum.EXCEEDED) {
                return {
                    title: i18n.t(msg`Budget exceeded`),
                    body: i18n.t(msg`You've exceeded your ${target} budget`)
                };
            }

            return {
                title: i18n.t(msg`Budget warning`),
                body: i18n.t(msg`You've used ${percentage}% of your ${target} budget`)
            };
        }

        if (alert.type === BudgetAlertTypeEnum.PACE) {
            return {
                title: i18n.t(msg`Spending pace alert`),
                body: i18n.t(msg`You're spending faster than planned - ${percentage}% spent`)
            };
        }

        if (alert.type === BudgetAlertTypeEnum.LARGE_EXPENSE) {
            return {
                title: i18n.t(msg`Large expense`),
                body: i18n.t(msg`Large expense detected (${percentage}% of budget)`)
            };
        }

        return {
            title: i18n.t(msg`Budget forecast`),
            body: i18n.t(msg`You're on track to exceed your ${target} budget`)
        };
    }
}

export const budgetAlertNotificationService = new BudgetAlertNotificationService();
