/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Döngüsel bağımlılıklara izin verilmez.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'packages-do-not-import-apps',
      severity: 'error',
      comment: 'packages/* altındaki paketler apps/* altındaki uygulamaları import edemez.',
      from: {
        path: '^packages/',
      },
      to: {
        path: '^apps/',
      },
    },
    {
      name: 'apps-do-not-import-apps',
      severity: 'error',
      comment: 'Uygulamalar diğer uygulamaların dahili kodlarını doğrudan import edemez.',
      from: {
        path: '^apps/([^/]+)/',
      },
      to: {
        path: '^apps/(?!$1/)[^/]+/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules|dist|\\.next|\\.turbo|generated',
    },
    exclude: {
      path: 'node_modules|dist|\\.next|\\.turbo|\\.git|generated',
    },
    tsPreCompilationDeps: true,
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
