import { useMorphingSheetDismiss } from '../context/morphing-sheet.context';

export const useMorphingSheetCommit = <TValue>(onCommit: (value: TValue) => void) => {
    const dismiss = useMorphingSheetDismiss();

    return (value: TValue) => {
        onCommit(value);
        dismiss();
    };
};
