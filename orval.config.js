module.exports = {
  llmApi: {
    input: {
      target: './apps/api/internal/docs/swagger.json',
    },
    output: {
      target: './lib/generated/llmApi.ts',
      client: 'fetch',
      mode: 'single',
      clean: false,
      prettier: true,
      override: {
        mutator: {
          path: './lib/llmFetcher.ts',
          name: 'llmFetcher',
        },
      },
    },
  },
};
