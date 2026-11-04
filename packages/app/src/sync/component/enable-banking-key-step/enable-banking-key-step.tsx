import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Linking } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { Input } from '../../../@generic/component/input/input';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import { EnableBankingKeyStepSelector } from './enable-banking-key-step.selector';

interface Props {
    readonly applicationId: string;
    readonly isKeyPicked: boolean;
    readonly onApplicationIdChange: (applicationId: string) => void;
    readonly onPickKey: () => void;
}

const TERMS_URL = 'https://enablebanking.com/terms';

export const EnableBankingKeyStep = ({ applicationId, isKeyPicked, onApplicationIdChange, onPickKey }: Props) => {
    const { t } = useLingui();

    const pickedMark = isKeyPicked ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null;
    const keyTitle = isKeyPicked ? t`Key file loaded` : t`Choose key file`;
    const keySubtitle = isKeyPicked ? t`Tap to choose another` : t`The .pem file you saved`;
    const handleOpenTerms = () => void Linking.openURL(TERMS_URL);

    return (
        <>
            <GroupedListSection footer={t`Your key stays in this phone's secure storage.`}>
                <SettingsRow
                    icon={UserIconNameEnum.FileKey}
                    variant="secondary"
                    title={keyTitle}
                    subtitle={keySubtitle}
                    right={pickedMark}
                    onPress={onPickKey}
                    testID={EnableBankingKeyStepSelector.ChooseKeyFile}
                />
                <SettingsRow
                    icon={UserIconNameEnum.Hash}
                    variant="secondary"
                    title={t`Application ID`}
                    subtitle={
                        <Input
                            value={applicationId}
                            onChangeText={onApplicationIdChange}
                            placeholder={t`Filled in from the key file name`}
                            accessibilityLabel={t`Application ID`}
                            autoCapitalize="none"
                            autoCorrect={false}
                            borderless
                            className="-my-[13px] h-auto min-h-[44px] px-0 text-[13px]"
                        />
                    }
                />
            </GroupedListSection>

            <GroupedListSection
                footer={t`Personal accounts only. Enable Banking's Terms allow this for private individuals using their own accounts. By connecting you accept them.`}
            >
                <GroupedListRow
                    title={t`Read the Enable Banking Terms`}
                    onPress={handleOpenTerms}
                    testID={EnableBankingKeyStepSelector.Terms}
                />
            </GroupedListSection>
        </>
    );
};
