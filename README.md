# local-blueprints-samples

This repository contains local blueprints that can be integrated into a jhipster project.

### Warning

Designed to run using unreleased jhipster v8.

### Usage

Got to your project folder, add the repository as a sub-module at the local blueprint folder:

```
git submodule add https://github.com/mshima/local-blueprints-samples.git .blueprint
```

Regenerate using the blueprint you want:

```
jhipster --enable-local-blueprint xx1 xxx2
```
