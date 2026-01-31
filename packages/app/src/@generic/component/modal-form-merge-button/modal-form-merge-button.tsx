import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';

import { Button } from '../button/button';

interface Props {
    readonly content: ReactNode;
    readonly onPress: () => void;
}

export const ModalFormMergeButton = ({ content, onPress }: Props) => (
    <Button variant="ghost" size="sm" leftIcon={UserIconNameEnum.Merge} onPress={onPress} content={content} />
);
