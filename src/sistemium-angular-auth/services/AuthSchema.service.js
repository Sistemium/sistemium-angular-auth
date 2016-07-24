'use strict';

angular.module('sistemiumAngularAuth.services')
  .service('AuthSchema', function (saSchema,$http) {

    return saSchema({

      getCount: function (params) {
        var resource = this;
        var bp = resource.getAdapter('http').defaults.basePath;
        return $http.get(
          bp + '/' + resource.endpoint,
          {
            params: angular.extend ({'agg:': 'count'}, params || {})
          }
        ).then(function (res) {
          return parseInt (res.headers('x-aggregate-count')) || res.data && res.data.count;
        });
      },

      getList: function (params) {
        return this.findAll (params,{bypassCache:true});
      }

    });

  });
