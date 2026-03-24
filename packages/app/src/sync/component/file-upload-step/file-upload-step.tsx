import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly instructionText: string;
    readonly selectFileText: string;
}

export const FileUploadStep = ({ instructionText, selectFileText }: Props) => (
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
        </>
    );
