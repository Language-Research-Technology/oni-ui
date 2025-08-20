import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['scripts/*.mts', 'src/main.ts', 'src/assets/main.css', '**/__tests__/*'],
  ignore: [
    // https://github.com/webpro-nl/knip/issues/504#issuecomment-2532321511
    'env.d.ts',
  ],
  ignoreBinaries: ['scripts/fetch-vocabs.mts'],
  ignoreDependencies: ['@tsconfig/node-lts'],
  compilers: {
    // For tailwind
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

export default config;
