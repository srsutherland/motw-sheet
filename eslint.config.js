import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,js,mjs,jsx}'],
    },

    globalIgnores(['**/dist/**', '**/coverage/**']),

    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },

    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],

    // components declare props/emit by convention, regardless of if used
    {
        rules: {
            'no-unused-vars': ['error', { varsIgnorePattern: '^(props|emit)$' }],
        },
    },

    // show/* components are named after sheet sections (Luck, Harm, ...);
    // the folder already namespaces them
    {
        files: ['src/components/show/**/*.vue'],
        rules: {
            'vue/multi-word-component-names': 'off',
        },
    },

    // Formatting. Only these rules are enforced (and fixed by `npm run lint`);
    // line breaks and everything else about layout are left as written.
    {
        plugins: { '@stylistic': stylistic },
        rules: {
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/eol-last': 'error',
            // reported, never auto-fixed: where to break a long line is up to you
            '@stylistic/max-len': ['warn', {
                code: 100,
                ignoreUrls: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
            }],
        },
    },
    {
        files: ['**/*.vue'],
        rules: {
            // .vue files: nothing directly inside <template> or <script> is indented
            '@stylistic/indent': 'off',
            'vue/script-indent': ['error', 4, { baseIndent: 0, switchCase: 1 }],
            'vue/html-indent': ['error', 4, { baseIndent: 0 }],
            'vue/html-quotes': ['error', 'double'],
            // once a tag spans several lines, one attribute per line;
            // single-line tags are never split (the max is just "a lot")
            'vue/max-attributes-per-line': ['error', {
                singleline: { max: 20 },
                multiline: { max: 1 },
            }],
        },
    },
]);
