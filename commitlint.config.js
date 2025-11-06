module.exports = {
    extends: ['@commitlint/config-conventional', '@commitlint/config-lerna-scopes'],
    rules: {
        'header-pattern': [2, 'always', /^(?:\[(WIP|wip)\]\s*)?(.*)$/]
    }
};
