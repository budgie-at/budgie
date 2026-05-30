module.exports = function (api) {
    api.cache(true);

    return {
        presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
        plugins: [
            '@babel/plugin-transform-class-static-block',
            'react-native-worklets/plugin',
            '@lingui/babel-plugin-lingui-macro',
            ['inline-import', { extensions: ['.sql'] }]
        ]
    };
};
