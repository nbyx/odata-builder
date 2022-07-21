import typescript from 'rollup-plugin-ts';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './src/index.ts',
  plugins: [typescript(), terser()],
  output: [
    {
      file: './lib/odata-builder.esm.js',
      format: 'esm',
      exports: 'auto'
    },
    {
      file: './lib/odata-builder.js',
      format: 'cjs',
      exports: 'auto'
    },
  ],
};