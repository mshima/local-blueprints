import { getBaseApplication } from './generator.mjs';

export const createGenerator = async env => {
  const BaseApplication = await getBaseApplication(env);
  return class extends BaseApplication {
    contextPath;

    get [BaseApplication.PROMPTING]() {
      return this.asPromptingTaskGroup({
        async promptContextPath() {
          await this.prompt(
            {
              name: 'contextPath',
              message: 'Which contextPath do you want to use?',
              validate: val => {
                if (!val.startsWith('/')) return 'The contextPath should start with /';
                if (val.endsWith('/')) return 'The contextPath should not end with /';
                return true;
              },
            },
            this.blueprintStorage,
          );
        },
      });
    }

    get [BaseApplication.LOADING]() {
      return this.asLoadingTaskGroup({
        loadConfig() {
          this.contextPath = this.blueprintConfig.contextPath;
        },
      });
    }

    get [BaseApplication.POST_WRITING]() {
      return this.asPostWritingTaskGroup({
        async applyingContextPath({ application }) {
          this.log.info('Applying context-path');
          if (application.clientFrameworkAngular) {
            this.editFile('angular.json', content => {
              const jsonContent = JSON.parse(content);
              jsonContent.projects[Object.keys(jsonContent.projects)[0]].architect.build.options.baseHref = `${this.contextPath}/`;
              return JSON.stringify(jsonContent, null, 2);
            });
            this.editFile('src/main/webapp/app/app.module.ts', content =>
              content
                .replace(
                  "import { registerLocaleData } from '@angular/common';",
                  "import { APP_BASE_HREF, PlatformLocation, registerLocaleData } from '@angular/common';",
                )
                .replace(
                  '    Title,',
                  `    {
      provide: APP_BASE_HREF,
      useFactory: (platformLocation: PlatformLocation) => platformLocation.getBaseHrefFromDOM(),
      deps: [PlatformLocation],
    },
    Title,`,
                ),
            );
            this.editFile('webpack/proxy.conf.js', content =>
              content
                .replace(
                  '  const serverResources =',
                  `  const projects = require('../angular.json').projects;
  const contextPath = projects[Object.keys(projects)[0]].architect.build.options.baseHref ?? '';
  const serverResources =`,
                )
                .replace('context: serverResources,', 'context: serverResources.map(res => `${contextPath}${res}`),'),
            );
          }
          if (!application.skipServer) {
            this.editFile('src/main/webapp/swagger-ui/index.html', content =>
              content.replace('<base href="/swagger-ui/"', `<base href="${this.contextPath}/swagger-ui/"`),
            );
            this.editFile('src/main/resources/config/application.yml', content => `${content}
---
server:
  servlet:
    context-path: ${this.contextPath}/
`);
          }
        },
      });
    }
  };
};
