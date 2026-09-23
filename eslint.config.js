import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import skipFormatting from 'eslint-config-prettier/flat';

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

    // formatting is Prettier's job
    skipFormatting,
]);
