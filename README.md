[![npm](https://img.shields.io/npm/v/@kronos-integration/service-health-check.svg)](https://www.npmjs.com/package/@kronos-integration/service-health-check)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/@kronos-integration/service-health-check)](https://bundlephobia.com/result?p=@kronos-integration/service-health-check)
[![downloads](http://img.shields.io/npm/dm/@kronos-integration/service-health-check.svg?style=flat-square)](https://npmjs.org/package/@kronos-integration/service-health-check)
[![Build Action Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2FKronos-Integration%2Fservice-health-check%2Fbadge&style=flat)](https://actions-badge.atrox.dev/Kronos-Integration/service-health-check/goto)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/Kronos-Integration/service-health-check.git)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/Kronos-Integration/service-health-check/badge.svg)](https://snyk.io/test/github/Kronos-Integration/service-health-check)

# kronos-service-health-check

collects and reports system health status

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [ServiceHealthCheck](#servicehealthcheck)
    -   [autostart](#autostart)
    -   [isHealthy](#ishealthy)
    -   [name](#name)

## ServiceHealthCheck

**Extends Service**

Collects health state form all components
Currently we only check that there is no service is in failed state

### autostart

Start immediate

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true

### isHealthy

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if there are no failed services

### name

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 'health-check'

# install

With [npm](http://npmjs.org) do:

```shell
npm install kronos-service-health-check
```

# license

BSD-2-Clause