import { SettingsCreateEntityInterface } from '@budgie/contracts';

export interface TranscodeTargetInterface {
    readonly key: string | null;
    readonly settings: Partial<SettingsCreateEntityInterface>;
}
