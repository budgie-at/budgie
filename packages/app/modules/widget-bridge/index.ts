import { requireOptionalNativeModule } from 'expo';

import { isDefined } from '@rnw-community/shared';

import type { WidgetBridgeNativeModuleInterface } from './interface/widget-bridge-native-module.interface';

const widgetBridge = requireOptionalNativeModule<WidgetBridgeNativeModuleInterface>('WidgetBridge');

export const canPublishWidgetSnapshot = (): boolean => isDefined(widgetBridge) && widgetBridge.isAvailable();

export const publishWidgetSnapshot = async (json: string): Promise<boolean> =>
    isDefined(widgetBridge) ? await widgetBridge.publish(json) : false;

export const clearWidgetSnapshot = async (): Promise<boolean> => (isDefined(widgetBridge) ? await widgetBridge.clear() : false);
