import type { LocalNotificationChannelInterface } from './local-notification-channel.interface';

export interface ScheduledLocalNotificationInterface {
    readonly channel: LocalNotificationChannelInterface;
    readonly identifier: string;
    readonly title: string;
    readonly body: string;
    readonly data: Record<string, unknown>;
    readonly date: Date;
}
