import { RefCallBack } from 'react-hook-form';

export interface AccountFormFieldInterface<Value> {
    readonly value: Value;
    readonly onChange: (value: Value) => void;
    readonly onBlur: () => void;
    readonly ref: RefCallBack;
}
