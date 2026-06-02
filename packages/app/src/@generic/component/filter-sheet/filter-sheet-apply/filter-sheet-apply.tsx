import { UserIconNameEnum } from '@budgie/contracts';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../button/button';

interface Props {
    readonly onApply: EmptyFn;
    readonly label: string;
    readonly disabled?: boolean;
    readonly testID?: string;
}

export const FilterSheetApply = ({ onApply, label, disabled, testID }: Props) => (
    <Button
        className="grow"
        variant="cta"
        onPress={onApply}
        content={label}
        rightIcon={UserIconNameEnum.ArrowRight}
        disabled={disabled}
        testID={testID}
    />
);
