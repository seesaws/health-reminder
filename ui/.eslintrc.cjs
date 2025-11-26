module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    globals: {
        chrome: 'readonly'
    },
    extends: ['eslint:recommended', 'plugin:react/recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    }
};