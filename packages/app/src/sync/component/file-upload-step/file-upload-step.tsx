import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly isLoading: boolean;
    readonly onSelectFile: () => void;
    readonly instructionText: string;
    readonly selectFileText: string;
}

export const FileUploadStep = ({ isLoading, onSelectFile, instructionText, selectFileText }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={instructionText}
            />

            <View className="gap-y-md">
                <Text className="text-primary text-muted-foreground text-sm px-md">{selectFileText}</Text>
            </View>

            <Button onPress={onSelectFile} disabled={isLoading} content={t`Select File`} leftIcon={UserIconNameEnum.Upload} />
        </>
    );
};
