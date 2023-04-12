# local-blueprints

This repository contains local blueprints that can be integrated into a jhipster project.

### Warning

Designed to run using unreleased jhipster v8.

### Usage

Got to your project folder, add the repository as a sub-module at the local blueprint folder:

```sh
git submodule add https://github.com/mshima/local-blueprints.git .blueprint
```

Regenerate using the local blueprint you want:

```sh
jhipster --enable-local-blueprint xx1 xxx2 # where xx1 and xx2 are app/xx1.mjs and app/xx2.mjs files
```
