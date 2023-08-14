import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const localBlueprintPath = localBlueprint => join(__dirname, `${localBlueprint}.mjs`);

/**
 * @param {import('yeoman-environment').default}
 * @return {import('generator-jhipster/generators/base-application').default}
 */
export const getBaseApplication = async env => {
  try {
    // Try to use locally installed generator-jhipster
    return (await import('generator-jhipster/generators/base-application')).default;
  } catch (error) {
    // Fallback to the currently running jhipster.
    return await env.requireGenerator('jhipster:base-application');
  }
};

export const createGenerator = async env => {
  const BaseApplication = await getBaseApplication(env);
  return class extends BaseApplication {
    constructor(args, opts, features) {
      super(args, opts, { ...features, sbsBlueprint: true });

      this.option('enable-local-blueprint', {
        desc: 'Enable local blueprint',
        type: Array,
      });
    }

    get [BaseApplication.INITIALIZING]() {
      return {
        async initializing() {
          this.blueprintConfig.enabledLocalBlueprint = [
            ...new Set([...(this.blueprintConfig.enabledLocalBlueprint ?? []), ...(this.options.enableLocalBlueprint ?? [])]),
          ];
        },
      };
    }

    get [BaseApplication.COMPOSING]() {
      return {
        async compose() {
          const enabledLocalBlueprint = this.blueprintConfig.enabledLocalBlueprint ?? [];
          this.log.info(`Using local blueprints '${enabledLocalBlueprint}'`);
          for (const localBlueprint of enabledLocalBlueprint) {
            await this.composeWithJHipster(localBlueprintPath(localBlueprint));
          }
        },
      };
    }
  };
};
