module.exports = {
  root: true,
  extends: [require.resolve('@grocery-savings/config/eslint/next')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
