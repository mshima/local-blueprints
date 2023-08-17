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
        async applyContextPathToAngular({ application }) {
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
        },

        async applyContextPathToCommon({ application }) {
          if (!application.skipClient) {
            this.editFile('src/main/webapp/swagger-ui/index.html', content =>
              content.replace('<base href="/swagger-ui/"', `<base href="${this.contextPath}/swagger-ui/"`),
            );
          }
        },

        async applyContextPathToServer({ application }) {
          if (!application.skipServer) {
            this.editFile(
              'src/main/resources/config/application.yml',
              content => `${content}
---
server:
  servlet:
    context-path: ${this.contextPath}/
`,
            );
          }
        },

        async applyContextPathToCypress({ application }) {
          if (application.cypressTests) {
            this.editFile('src/test/javascript/cypress/support/commands.ts', content =>
              content.replace(
                'declare global {',
                `

/* Make intercept baseUrl aware */
Cypress.Commands.overwrite('intercept', (originalFn: any, ...args: any[]) => {
  const baseUrl = Cypress.config('baseUrl');
  if (typeof args[1] === 'string' && args[1].startsWith('/')) {
    args[1] = \`\${baseUrl}\${args[1]}\`;
  }
  if (typeof args[0].url === 'string' && args[0].url.startsWith('/')) {
    args[0].url = \`\${baseUrl}\${args[0].url}\`;
  }
  return originalFn(...args);
});

declare global {`,
              ),
            );
            this.editFile('src/test/javascript/cypress/support/navbar.ts', content =>
              content.replaceAll('href="/', `href="${this.contextPath}/`),
            );
            this.editFile('cypress.config.ts', content =>
              content.replace(/baseUrl: 'http:\/\/localhost:(.*)\/'/, `baseUrl: 'http://localhost:$1${this.contextPath}/'`),
            );
          }
        },
      });
    }
  };
};
