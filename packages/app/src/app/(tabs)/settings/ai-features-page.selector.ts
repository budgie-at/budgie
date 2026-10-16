export const AiFeaturesPageSelector = {
    Container: 'AiFeaturesPage.Container',
    FeatureSwitch: (settingKey: string) => `AiFeaturesPage.${settingKey}`,
    FeatureSwitchStateOn: (settingKey: string) => `AiFeaturesPage.${settingKey}.State.On`,
    FeatureSwitchStateOff: (settingKey: string) => `AiFeaturesPage.${settingKey}.State.Off`
};
