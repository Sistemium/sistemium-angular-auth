'use strict';

(function () {

  angular.module('sistemiumAngularAuth.services')
    .service('AuthSchema', AuthSchema);

  function AuthSchema(saSchema, $http, saaAppConfig) {

    var schema = saSchema({

      getCount: function (params) {
        var resource = this;
        var bp = resource.getAdapter('http').defaults.basePath;
        return $http.get(
          bp + '/' + resource.endpoint,
          {
            params: angular.extend({'agg:': 'count'}, params || {})
          }
        ).then(function (res) {
          return parseInt(res.headers('x-aggregate-count')) || res.data && res.data.count;
        });
      },

      getList: function (params) {
        return this.findAll(params, {bypassCache: true});
      }

    });

    return _.defaults({

      register: function (config) {
        return schema.register(_.defaults(config, {
          defaultAdapter: 'http',
          basePath: saaAppConfig.authApiUrl,
          endpoint: config.name.replace(/^sa(.)/, function (p,l) { return l.toLowerCase(); })
        }));
      }

    }, schema);

  }

})();
