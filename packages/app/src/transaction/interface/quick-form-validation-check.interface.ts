import type { QuickFormValidationField } from './quick-form-validation-field.type';

export interface QuickFormValidationCheckInterface {
    readonly isValid: boolean;
    readonly field: QuickFormValidationField;
    readonly message: string;
    readonly shake?: () => void;
}
