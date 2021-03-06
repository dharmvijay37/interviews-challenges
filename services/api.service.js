const ApiGateway = require("moleculer-web");

module.exports = {
  name: "api",
  mixins: [ApiGateway],
  settings: {
    port: process.env.PORT || 3000,
    routes: [
      {
        path: "/api",
        aliases: {
          "POST /register": "auth.register",
          "POST /login": "auth.login",
          "GET  /products": "product.getProducts",
          "GET  /seed": "auth.seeder",
        },
        authentication: false,
        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB",
          },
          urlencoded: {
            extended: true,
            limit: "1MB",
          },
        },
        mappingPolicy: "restrict",
        logging: true,
      },
      {
        path: "/api/user",
        aliases: {
          "POST /cart": "cart.addToCart",
          "GET /cart": "cart.getCartSummary",
        },
        authentication: true,
        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB",
          },
          urlencoded: {
            extended: true,
            limit: "1MB",
          },
        },
        mappingPolicy: "restrict",
        logging: true,
      },
    ],
    onError(req, res, err) {
      // Return with the error as JSON object
      res.setHeader("Content-type", "application/json; charset=utf-8");
      res.writeHead(err.code || 500);
      const errResponse = {
        success: "false",
        message: err.message,
        payload: {},
      };
      res.end(JSON.stringify(errResponse));
      this.logResponse(req, res, err ? err.ctx : null);
    },
    log4XXResponses: false,
    logRequestParams: "info",
    logResponseData: "info",
  },
  methods: {
    async authenticate(ctx, route, req) {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith("Bearer")) {
        const authToken = auth.slice(7);
        const token = await ctx.call("auth.verifyToken", { authToken });
        if (token.userId) {
          ctx.meta.userId = token.userId;
          return true;
        }
        return Promise.reject(
          new ApiGateway.Errors.UnAuthorizedError(
            ApiGateway.Errors.ERR_INVALID_TOKEN,
          ),
        );
      }
      return Promise.reject(
        new ApiGateway.Errors.UnAuthorizedError(
          ApiGateway.Errors.ERR_NO_TOKEN,
        ),
      );
    },
  },
};
