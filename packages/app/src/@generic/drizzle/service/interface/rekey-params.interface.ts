import { SettingsEntityInterface } from '@budgie/contracts';

export interface RekeyParamsInterface {
    readonly nextKey: string | null;
    readonly nextSettings?: Pick<SettingsEntityInterface, 'isBiometricEnabled' | 'isPinEnabled'>;
}
