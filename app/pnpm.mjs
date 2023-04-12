import { getBaseApplication } from "./generator.mjs";

export const createGenerator = async env => {
  const BaseApplication = await getBaseApplication(env);
  return class extends BaseApplication {
    get [BaseApplication.INITIALIZING]() {
      return {
        warn() {
          this.logger.warn('pnpm local blueprint is a feature preview');
        },
      };
    }

    get [BaseApplication.POST_WRITING]() {
      return {
        async switchToPnpm({ application }) {
          this.log.info('Switching package manager to pnpm');
          if (!application.skipClient) {
            this.editFile(
              'npmw',
              () => `#!/bin/sh
  
  pnpm config set auto-install-peers true --location project
  pnpm config set strict-peer-dependencies false --location project
  
  Here are the details
  
  pnpm "$@"`
            );
          }
          if (application.buildToolGradle) {
            this.editFile('build.gradle', { ignoreNonExisting: true }, content =>
              content.replaceAll('NpmTask', 'PnpmTask').replaceAll('npm_install', 'pnpm_install')
            );
            this.editFile('gradle/profile_dev.gradle', content => content.replaceAll('NpmTask', 'PnpmTask'));
          }
        },
      };
    }
  };
};
