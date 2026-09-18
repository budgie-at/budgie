import { SettingsEntityInterface } from '@budgie/contracts';

export interface RekeyParamsInterface {
    readonly nextKey: string | null;
    readonly nextSettings?: Partial<Pick<SettingsEntityInterface, 'isBiometricEnabled' | 'isPinEnabled' | 'isWidgetAmountsEnabled'>>;
}
