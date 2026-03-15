import { UserIconNameEnum } from '@budgie/contracts';

import { Button } from '../button/button';

interface Props {
    readonly content: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const ModalFormMergeButton = ({ content, onPress, testID }: Props) => (
    <Button testID={testID} variant="ghost" size="sm" leftIcon={UserIconNameEnum.Merge} onPress={onPress} content={content} />
);
