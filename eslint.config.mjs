import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import { fixupPluginRules } from '@eslint/compat';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import nodePlugin from 'eslint-plugin-n';
import eslintPluginOxlint from 'eslint-plugin-oxlint';
import promisePlugin from 'eslint-plugin-promise';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import pluginLingui from 'eslint-plugin-lingui';
import rnwcPlugin from '@rnw-community/eslint-plugin';

import { maxComponentPropsRule } from './eslint-rules/max-component-props.mjs';

const compatibleImportPlugin = fixupPluginRules(importPlugin);
const compatibleReactPlugin = fixupPluginRules(reactPlugin);
const compatibleRnwCommunityPlugin = fixupPluginRules(rnwcPlugin);
const compatibleImportRecommendedConfig = {
    ...importPlugin.flatConfigs.recommended,
    plugins: { import: compatibleImportPlugin }
};
const compatibleImportTypescriptConfig = {
    ...importPlugin.flatConfigs.typescript,
    plugins: { import: compatibleImportPlugin }
};
const compatibleReactRecommendedConfig = {
    ...reactPlugin.configs.flat.recommended,
    plugins: { react: compatibleReactPlugin }
};
const residualRuleIds = `no-restricted-exports no-unreachable-loop no-useless-assignment @typescript-eslint/no-unnecessary-condition import/export promise/no-return-in-finally react/require-render-return @stylistic/lines-between-class-members budgie/max-component-props lingui/t-call-in-function lingui/no-single-tag-to-translate lingui/no-single-variables-to-translate lingui/no-trans-inside-trans lingui/no-expression-in-message lingui/no-unlocalized-strings @rnw-community/no-complex-jsx-logic consistent-this id-denylist id-length no-restricted-syntax require-atomic-updates @typescript-eslint/naming-convention @typescript-eslint/member-ordering n/hashbang n/no-deprecated-api n/no-extraneous-import n/no-extraneous-require n/no-missing-require n/no-process-exit n/no-unpublished-bin n/no-unpublished-import n/no-unpublished-require n/no-unsupported-features/es-builtins n/no-unsupported-features/node-builtins n/process-exit-as-throw camelcase no-invalid-this no-octal no-octal-escape no-undef-init nonblock-statement-body-position newline-before-return import/order react/jsx-uses-react react/jsx-uses-vars react/no-deprecated react-hooks/static-components react-hooks/use-memo react-hooks/component-hook-factories react-hooks/preserve-manual-memoization react-hooks/incompatible-library react-hooks/immutability react-hooks/globals react-hooks/refs react-hooks/set-state-in-effect react-hooks/error-boundaries react-hooks/purity react-hooks/set-state-in-render react-hooks/unsupported-syntax react-hooks/config react-hooks/gating sort-imports`.split(' ');
const oxlintFallbackConfigs = eslintPluginOxlint.buildFromOxlintConfigFile(fileURLToPath(new URL('./.oxlintrc.json', import.meta.url))).map(config => ({
    ...config,
    rules: Object.fromEntries(Object.entries(config.rules ?? {}).filter(([ruleId]) => !residualRuleIds.includes(ruleId)))
}));

export default defineConfig(
    {
        ignores: [
            '**/.next/**',
            '**/.turbo/**',
            '**/.expo/**',
            '**/.android/**',
            '**/.ios/**',
            '.agents/**',

            '**/node_modules/**',
            '**/dist/**',
            '**/public/**',
            '**/build/**',
            '**/drizzle/**',

            '**/*.html',
            '**/*.json',
            '**/*.d.ts',

            '**/messages.po',
            '**/messages.ts',
            '**/babel.config.js',
            '**/fingerprint.config.js',
            'packages/app/scripts/**',

            'eslint.config.mjs'
        ]
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.all],
        plugins: { '@stylistic': stylistic },
        rules: {
            camelcase: ['error', { properties: 'never' }],
            complexity: ['error', 25],
            'consistent-return': 'off',
            'dot-notation': 'off',
            indent: 'off',
            strict: 'off',
            'init-declarations': 'off',
            'class-methods-use-this': 'off',
            'one-var': 'off',
            'new-cap': 'off',
            'lines-between-class-members': 'off',
            '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
            'no-duplicate-imports': 'off',
            'no-ternary': 'off',
            'no-void': 'off',
            'no-useless-constructor': 'off',
            'no-undef': 'off',
            'no-magic-numbers': 'off',
            'no-unused-vars': 'off',
            'sort-imports': [
                'error',
                {
                    allowSeparatedGroups: false,
                    ignoreCase: false,
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: false,
                    memberSyntaxSortOrder: ['all', 'multiple', 'none', 'single']
                }
            ],
            'no-warning-comments': ['error', { terms: ['fixme', 'xxx'], location: 'start' }],
            'sort-keys': 'off',
            'no-shadow': 'off',
            'no-return-await': 'off',
            'no-empty-function': ['error', { allow: ['constructors'] }],
            'capitalized-comments': 'off',
            'arrow-body-style': ['error', 'as-needed'],
            curly: ['error', 'all'],
            'nonblock-statement-body-position': ['error', 'below'],
            'multiline-ternary': 'off',
            'max-lines-per-function': ['error', { max: 85, skipBlankLines: true, skipComments: true }],
            'max-statements': ['error', { max: 12 }, { ignoreTopLevelFunctions: true }],
            'id-length': ['error', { exceptions: ['x', 'y', 'z', 'i', 'j', 'e', '_', 'w', 'h', 't'] }],
            'max-params': 'off',
            'operator-linebreak': 'off',
            'newline-before-return': 'error',
            'require-await': 'off',
            'prefer-named-capture-group': 'off',
            'member-ordering': 'off'
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [tseslint.configs.strictTypeChecked],
        rules: {
            '@typescript-eslint/class-methods-use-this': 'off',
            '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
            '@typescript-eslint/no-magic-numbers': [
                'error',
                {
                    ignore: [
                        -20, -10, -2, -4, -3, -6, -5, -1, -0.5, 0, 0.0001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.35, 0.5, 0.6, 0.64, 0.65, 0.66,
                        0.75, 0.76, 0.79, 0.8, 0.81, 0.83, 1, 1.5, 1.8, 1.97, 2, 2.5, 3, 3.2, 3.25, 4, 4.25, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8,
                        9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 31.5, 32, 33, 35, 34, 36,
                        37, 38, 39, 40, 41, 42, 45, 48, 50, 51, 59, 60, 70, 75, 80, 96, 99, 100, 125, 150, 180, 200, 201, 250, 255, 256,
                        300, 307, 308, 350, 360, 365, 400, 404, 405, 500, 600, 640, 725, 750, 900, 1000, 1024, 1200, 1600, 2000, 2019, 2500,
                        3000, 3500, 3600, 5000, 6000, 10000, 10001, 10100, 16000, 30000, 60000, 120000, 1000000000, 999
                    ]
                }
            ],
            '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreVoidOperator: true }],
            '@typescript-eslint/no-meaningless-void-operator': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/promise-function-async': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/max-params': ['error', { max: 4 }],
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: {
                        attributes: false
                    }
                }
            ],
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            '@typescript-eslint/no-deprecated': 'off',
            '@typescript-eslint/no-unnecessary-type-parameters': 1,
            '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 5 }],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '(^_)|(Fields$)',
                    ignoreRestSiblings: true
                }
            ],
            '@typescript-eslint/no-empty-object-type': 1,
            '@typescript-eslint/no-extraneous-class': [2, { allowWithDecorator: true }],
            '@typescript-eslint/naming-convention': ['error', { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] }],
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    classes: [
                        'signature',
                        'public-static-field',
                        'protected-static-field',
                        'private-static-field',
                        'public-decorated-field',
                        'protected-decorated-field',
                        'private-decorated-field',
                        'public-instance-field',
                        'protected-instance-field',
                        'private-instance-field',
                        'public-abstract-field',
                        'protected-abstract-field',
                        'public-field',
                        'protected-field',
                        'private-field',
                        'static-field',
                        'instance-field',
                        'abstract-field',
                        'decorated-field',
                        'field',
                        'public-constructor',
                        'protected-constructor',
                        'private-constructor',
                        'constructor',
                        'public-static-get',
                        'protected-static-get',
                        'private-static-get',
                        'public-decorated-get',
                        'protected-decorated-get',
                        'private-decorated-get',
                        'public-instance-get',
                        'protected-instance-get',
                        'private-instance-get',
                        'public-abstract-get',
                        'protected-abstract-get',
                        'public-get',
                        'protected-get',
                        'private-get',
                        'static-get',
                        'instance-get',
                        'abstract-get',
                        'decorated-get',
                        'get',
                        'public-static-set',
                        'protected-static-set',
                        'private-static-set',
                        'public-decorated-set',
                        'protected-decorated-set',
                        'private-decorated-set',
                        'public-instance-set',
                        'protected-instance-set',
                        'private-instance-set',
                        'public-abstract-set',
                        'protected-abstract-set',
                        'public-set',
                        'protected-set',
                        'private-set',
                        'static-set',
                        'instance-set',
                        'abstract-set',
                        'decorated-set',
                        'set',
                        'public-decorated-method',
                        'protected-decorated-method',
                        'private-decorated-method',
                        'public-instance-method',
                        'protected-instance-method',
                        'private-instance-method',
                        'public-abstract-method',
                        'protected-abstract-method',
                        'public-method',
                        'protected-method',
                        'private-method',
                        'public-static-method',
                        'protected-static-method',
                        'private-static-method',
                        'static-method',
                        'instance-method',
                        'abstract-method',
                        'decorated-method',
                        'method'
                    ]
                }
            ]
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        plugins: { budgie: { rules: { 'max-component-props': maxComponentPropsRule } } },
        rules: {
            'budgie/max-component-props': [
                'error',
                {
                    max: 8,
                    allow: [
                        'packages/app/src/transaction/components/simple-quick-form-display/simple-quick-form-display.tsx',
                        'packages/app/src/transaction/components/quick-form-bottom-overlay/quick-form-bottom-overlay.tsx',
                        'packages/app/src/transaction/components/simple-quick-form/simple-quick-form.tsx',
                        'packages/app/src/transaction/components/transaction-picker/transaction-picker.tsx',
                        'packages/app/src/transaction/components/transaction-filter-selector-footer/transaction-filter-selector-footer.tsx',
                        'packages/app/src/transaction/components/transaction-amount-display/transaction-amount-display.tsx',
                        'packages/app/src/transaction/components/transaction-field-icons/transaction-field-icons.tsx',
                        'packages/app/src/transaction/interface/update-simple-transaction-page-props.interface.ts',
                        'packages/app/src/@generic/component/page-header/page-header.tsx',
                        'packages/app/src/@generic/component/searchable-page/searchable-page.tsx',
                        'packages/app/src/@generic/component/selector-card/selector-card.tsx',
                        'packages/app/src/transaction/components/simple-quick-form-controls/simple-quick-form-controls.tsx',
                        'packages/landing/src/blog/component/blog-posting-json-ld/blog-posting-json-ld.tsx',
                        'packages/app/src/@generic/component/ai-translation-fields/ai-translation-fields.tsx',
                        'packages/app/src/@generic/component/card/card.tsx',
                        'packages/app/src/@generic/component/circle-icon/circle-icon.tsx',
                        'packages/app/src/@generic/component/empty-state/empty-state.tsx',
                        'packages/app/src/@generic/component/form-amount-input/form-amount-input.tsx',
                        'packages/app/src/@generic/component/form-page/form-page.tsx',
                        'packages/app/src/@generic/component/selector-grid-content/selector-grid-content.tsx',
                        'packages/app/src/account/component/account-action-card/account-action-card.tsx',
                        'packages/app/src/account/component/account-card-base/account-card-base.tsx',
                        'packages/app/src/ai/component/voice-review-footer/voice-review-footer.tsx',
                        'packages/app/src/auth/components/pin-form/pin-form.tsx',
                        'packages/app/src/budget/components/budget-progress-bar/budget-progress-bar.tsx',
                        'packages/app/src/category/components/category-select-content/category-select-content.tsx',
                        'packages/app/src/rule/components/swipeable-rule-card/swipeable-rule-card.tsx',
                        'packages/app/src/settings/components/budget-setting-card/budget-setting-card.tsx',
                        'packages/app/src/tag/components/tags-select-content/tags-select-content.tsx',
                        'packages/app/src/transaction/components/split-entry-row/split-entry-row.tsx',
                        'packages/app/src/transaction/components/transaction-field-icon/transaction-field-icon.tsx',
                        'packages/app/src/transaction/components/transaction-keypad-button/transaction-keypad-button.tsx',
                        'packages/app/src/transaction/components/transaction-keypad/transaction-keypad.tsx',
                        'packages/landing/src/generic/component/blog-card/blog-card.tsx'
                    ]
                }
            ]
        }
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true
            }
        }
    },
    {
        files: ['**/*.service.ts'],
        rules: {
            'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }]
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [compatibleImportRecommendedConfig, compatibleImportTypescriptConfig],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module'
        },
        rules: {
            'import/named': 'off',
            'import/namespace': 'off',
            'import/default': 'off',
            'import/no-named-as-default-member': 'off',
            'import/no-unresolved': 'off',
            'import/no-named-as-default': 'off',
            'import/no-cycle': 'off',
            'import/no-unused-modules': 'off',
            'import/no-deprecated': 'off',
            'import/extensions': 'off',
            'import/order': [
                'error',
                {
                    alphabetize: {
                        caseInsensitive: true,
                        order: 'asc'
                    },
                    groups: ['builtin', 'external', 'object', 'parent', 'sibling', 'index', 'type'],
                    'newlines-between': 'always',
                    pathGroups: [
                        {
                            group: 'object',
                            pattern: '@rnw-community/*',
                            position: 'after'
                        }
                    ],
                    pathGroupsExcludedImportTypes: ['builtin', 'type']
                }
            ]
        }
    },
    {
        files: ['**/*.ts'],
        extends: [nodePlugin.configs['flat/recommended']],
        settings: {
            node: { version: '>=22.0.0' }
        },
        rules: {
            'n/no-missing-import': 'off',
            'n/no-unsupported-features/es-syntax': 'off',
            'n/no-extraneous-import': [
                'error',
                {
                    allowModules: ['@jest/globals']
                }
            ],
            'n/no-unpublished-bin': 'error'
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [promisePlugin.configs['flat/recommended']]
    },
    {
        files: ['packages/app/**/*.{ts,tsx}', 'packages/landing/**/*.{ts,tsx}'],
        extends: [pluginLingui.configs['flat/recommended']],
        rules: {
            'lingui/no-unlocalized-strings': [
                'error',
                {
                    ignore: [
                        '^(?![A-Z])\\S+$',
                        '^[A-Z0-9_-]+$',
                        'rgba',
                        'rgb',
                        '^Inter_[0-9A-Z]+',
                        '^Arrow[A-Z]+',
                        'Tab',
                        'Enter',
                        'use client'
                    ],
                    ignoreNames: [
                        { regex: { pattern: 'className', flags: 'i' } },
                        { regex: { pattern: 'icon', flags: 'i' } },
                        { regex: { pattern: 'sizes', flags: 'i' } },
                        { regex: { pattern: '^d$', flags: '' } }
                    ],
                    ignoreFunctions: [
                        'format',
                        'cva',
                        'Log',
                        'getLogger',
                        'logger.log',
                        'logger.error',
                        'logger.debug',
                        'syncLogger.log',
                        'syncLogger.error'
                    ]
                }
            ],
            'lingui/t-call-in-function': 2,
            'lingui/no-single-variables-to-translate': 2,
            'lingui/no-expression-in-message': 2,
            'lingui/no-single-tag-to-translate': 2,
            'lingui/no-trans-inside-trans': 2
        }
    },
    {
        files: ['packages/app/**/*.selector.ts'],
        rules: {
            'lingui/no-unlocalized-strings': 'off'
        }
    },
    {
        files: ['**/*.tsx', '**/*.hook.ts'],
        extends: [compatibleReactRecommendedConfig, reactHooksPlugin.configs.flat.recommended],
        plugins: { '@rnw-community': compatibleRnwCommunityPlugin },
        settings: {
            react: { version: 'detect' }
        },
        rules: {
            'max-statements': ['error', 15],
            '@rnw-community/no-complex-jsx-logic': 'error',
            'react-hooks/component-hook-factories': 'error',
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                    children: 'never'
                }
            ],
            'react/no-multi-comp': 'error',
            'react/react-in-jsx-scope': 'off',
            'react/jsx-curly-newline': 'off',
            'react/display-name': 'off',
            'react/prop-types': 'off',
            'react/forbid-component-props': 'off',
            'react/function-component-definition': 'off',
            'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
            'react/require-default-props': 'off',
            'react/jsx-props-no-spreading': 'off',
            'react/jsx-max-depth': ['error', { max: 6 }],
            'react/jsx-no-literals': 'off',
            'react/jsx-no-bind': 'off',
            'react/jsx-no-constructed-context-values': 'off',
            'react/jsx-max-props-per-line': 'off',
            'react/jsx-newline': 'off',
            'react/jsx-one-expression-per-line': 'off',
            'react/jsx-indent': 'off',
            'react-native/no-raw-text': 'off',
            'react/jsx-child-element-spacing': 'off',
            'react/destructuring-assignment': 'off',
            'react/no-unknown-property': ['error', { ignore: ['popover', 'popoverTarget', 'popoverTargetAction'] }]
        }
    },
    {
        files: [
            'packages/app/src/**/*.{ts,tsx}',
            'packages/contracts/src/**/*.ts',
            'packages/ai/src/**/*.ts',
            'packages/bank-sync/src/**/*.ts'
        ],
        rules: {
            'no-restricted-syntax': [
                'warn',
                {
                    selector: "BinaryExpression[operator='==='][right.raw='null']",
                    message: 'Use !isDefined(x) from @rnw-community/shared (CLAUDE.md Canonical Mapping).'
                },
                {
                    selector: "BinaryExpression[operator='==='][right.type='Identifier'][right.name='undefined']",
                    message: 'Use !isDefined(x) from @rnw-community/shared.'
                },
                {
                    selector: "BinaryExpression[operator='!=='][right.raw='null']",
                    message: 'Use isDefined(x) from @rnw-community/shared.'
                },
                {
                    selector: "BinaryExpression[operator='!=='][right.type='Identifier'][right.name='undefined']",
                    message: 'Use isDefined(x) from @rnw-community/shared.'
                },
                {
                    selector: "BinaryExpression[operator='==='][left.type='MemberExpression'][left.property.name='length'][right.value=0]",
                    message: 'Use isEmptyArray(x) or isEmptyString(x) from @rnw-community/shared.'
                },
                {
                    selector: "BinaryExpression[operator='>'][left.type='MemberExpression'][left.property.name='length'][right.value=0]",
                    message: 'Use isNotEmptyArray(x) or isNotEmptyString(x) from @rnw-community/shared.'
                },
                {
                    selector: "BinaryExpression[operator='==='][right.value='']",
                    message: 'Use isEmptyString(x) from @rnw-community/shared.'
                }
            ]
        }
    },
    ...oxlintFallbackConfigs,
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'off'
        }
    },
    {
        files: ['**/*.spec.ts'],
        extends: [jestPlugin.configs['flat/recommended']],
        rules: {
            'no-await-in-loop': 'off',

            'jest/require-hook': 'off',
            'jest/max-expects': 'off',
            'jest/unbound-method': 'off',
            'jest/expect-expect': 'off',
            'jest/no-done-callback': 'off',

            'no-undef': 'off',
            'no-undefined': 'off',
            'max-classes-per-file': 'off',
            'max-lines-per-function': 'off',
            'max-lines': 'off',
            'max-statements': 'off',
            'func-names': 'off',
            'promise/no-nesting': 'off',
            '@typescript-eslint/no-magic-numbers': 'warn'
        }
    }
);
