import { useLingui } from '@lingui/react/macro';

import { Button } from '../button/button';

interface Props {
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const ModalFormSaveButton = ({ disabled, onPress, testID }: Props) => {
    const { t } = useLingui();

    return <Button testID={testID} className="flex-1" variant="cta" onPress={onPress} disabled={disabled} content={t`Save`} />;
};
