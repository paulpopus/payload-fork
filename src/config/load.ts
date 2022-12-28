/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import { register } from 'esbuild-register/dist/node';
import pino from 'pino';
import Logger from '../utilities/logger';
import { SanitizedConfig } from './types';
import findConfig from './find';
import validate from './validate';
import { builtConfigPath } from './getBuiltConfigPath';
import { clientFiles } from './clientFiles';

const loadConfig = (logger?: pino.Logger): SanitizedConfig => {
  const localLogger = logger ?? Logger();

  const rawConfigPath = findConfig();
  let configPath = builtConfigPath;

  let unregister: () => void;

  if (process.env.NODE_ENV !== 'production') {
    ({ unregister } = register({
      platform: 'node',
    }));

    clientFiles.forEach((ext) => {
      require.extensions[ext] = () => null;
    });

    configPath = rawConfigPath;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let config = require(configPath);

  if (unregister) unregister();

  if (config.default) config = config.default;

  let validatedConfig = config;

  if (process.env.NODE_ENV !== 'production') {
    validatedConfig = validate(config, localLogger);
  }

  return {
    ...validatedConfig,
    paths: {
      configDir: path.dirname(rawConfigPath),
      config: configPath,
      rawConfig: rawConfigPath,
    },
  };
};

export default loadConfig;
