import { useLingui } from '@lingui/react/macro';

import { Button } from '../button/button';

interface Props {
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly content?: string;
}

export const ModalFormSaveButton = ({ disabled, onPress, testID, content }: Props) => {
    const { t } = useLingui();
    const label = content ?? t`Save`;

    return <Button className="flex-1" variant="cta" onPress={onPress} disabled={disabled} content={label} testID={testID} />;
};
