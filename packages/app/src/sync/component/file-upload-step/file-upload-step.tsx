import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly isLoading: boolean;
    readonly onSelectFile: () => void;
}

export const FileUploadStep = ({ isLoading, onSelectFile }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={t`Export your transactions as XLSX from the Privatbank24 app: Menu → Statements → Export to Excel.`}
            />

            <View className="gap-y-md">
                <Text className="text-primary text-muted-foreground text-sm px-md">
                    <Trans>Select the exported XLSX file:</Trans>
                </Text>
            </View>

            <Button onPress={onSelectFile} disabled={isLoading} content={t`Select File`} leftIcon={UserIconNameEnum.Upload} />
        </>
    );
};
