
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-WLPMF4O3.js"
    ],
    "route": "/productos"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-UBNPUDEH.js"
    ],
    "route": "/usuarios/editar"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-UBNPUDEH.js"
    ],
    "route": "/usuarios/*/editar"
  },
  {
    "renderMode": 0,
    "redirectTo": "/auth/login",
    "route": "/auth"
  },
  {
    "renderMode": 0,
    "route": "/auth/login"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-VC2GQJ2S.js"
    ],
    "route": "/auth/signup"
  },
  {
    "renderMode": 0,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 10661, hash: '2c83fe5e79874f655577474983e7337705e7bad209103f335c6c33668ba34fbc', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1240, hash: 'ff499ba64621bc48e80b948a2cc5f3ad101427ec84f827b838c260978b11308a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-3TEYQJDX.css': {size: 12129, hash: 'SyItmTX4+3M', text: () => import('./assets-chunks/styles-3TEYQJDX_css.mjs').then(m => m.default)}
  },
};
