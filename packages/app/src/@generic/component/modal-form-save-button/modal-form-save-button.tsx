import { useLingui } from '@lingui/react/macro';

import { Button } from '../button/button';

interface Props {
    readonly disabled?: boolean;
    readonly isLoading?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const ModalFormSaveButton = ({ disabled, isLoading, onPress, testID }: Props) => {
    const { t } = useLingui();

    return (
        <Button
            className="flex-1"
            variant="cta"
            onPress={onPress}
            disabled={disabled}
            isLoading={isLoading}
            content={t`Save`}
            testID={testID}
        />
    );
};
