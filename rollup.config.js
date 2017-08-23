import pkg from './package.json';

export default {
  plugins: [],
  external: ['kronos-service', 'model-attributes', 'kronos-endpoint'],
  input: pkg.module,

  output: {
    format: 'cjs',
    file: pkg.main
  }
};
