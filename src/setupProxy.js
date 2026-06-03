const { createProxyMiddleware } = require('http-proxy-middleware');

const projectId = process.env.REACT_APP_SANITY_PROJECT_ID || 'fnbgcar3';

module.exports = function (app) {
  app.use(
    '/sanity-api',
    createProxyMiddleware({
      target: `https://${projectId}.api.sanity.io`,
      changeOrigin: true,
      pathRewrite: { '^/sanity-api': '' },
    })
  );
};
