import { Trans } from '@lingui/react/macro';

import { Button } from '../button/button';

interface Props {
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const ModalFormSaveButton = ({ disabled, onPress, testID }: Props) => (
    <Button testID={testID} className="flex-1" variant="cta" onPress={onPress} disabled={disabled} content={<Trans>Save</Trans>} />
);
