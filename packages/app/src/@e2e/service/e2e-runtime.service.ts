import { E2ERuntimeOverridesInterface } from '../interface/e2e-runtime-overrides.interface';

const defaultValue: E2ERuntimeOverridesInterface = {
    forceProtected: false,
    forceFaceId: false,
    biometricAuthSuccess: null
};

let currentValue = defaultValue;

class E2ERuntimeService {
    getOverrides(): E2ERuntimeOverridesInterface {
        return currentValue;
    }

    setOverrides(value: E2ERuntimeOverridesInterface) {
        currentValue = value;
    }
}

export const e2eRuntimeService = new E2ERuntimeService();
