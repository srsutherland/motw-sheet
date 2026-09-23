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

    // app.js is the pre-Vue prototype
    globalIgnores(['**/dist/**', '**/coverage/**', 'app.js']),

    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },

    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],

    // show/ components are named after sheet sections (Luck, Harm, ...);
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
