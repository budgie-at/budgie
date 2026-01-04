import { ReactNode, useRef } from 'react';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

interface Option<T> {
    value: T;
    label: string;
    iconSlot?: ReactNode;
}

interface Props<T> {
    readonly value: T | null;
    readonly onChange: (value: T) => void;
    readonly options: Option<T>[];
    readonly label: string;
    readonly sheetTitle: string;
    readonly displayValue: string;
}

export const RuleActionBottomSheetSelector = <T,>(props: Props<T>) => {
    const { value, onChange, options, label, sheetTitle, displayValue } = props;
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const handleSelect = (newValue: T) => {
        onChange(newValue);
        handleClose();
    };

    return (
        <>
            <RuleSelectorField label={label} value={displayValue} onPress={handleOpen} />
            <RuleSelectorSheet ref={sheetRef} title={sheetTitle} options={options} selectedValue={value} onSelect={handleSelect} />
        </>
    );
};
