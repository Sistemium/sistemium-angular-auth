'use strict';

(function () {

  function authInterceptor($q, $injector, saToken, saaAppConfig) {

    return {

      // Add authorization token to headers
      request: function (config) {
        var token = saToken.get();

        config.headers = config.headers || {};

        if (token) {
          config.headers.authorization = token;
        }

        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function (response) {

        if (response.status === 401) {
          if (!saaAppConfig.loginState) {
            throw new Error('saaAppConfig.loginState not defined...');
          }
          $injector.get('$state').go(saaAppConfig.loginState);
          saToken.destroy();
        }
        return $q.reject(response);
      }

    };

  }

  angular.module('sistemiumAngularAuth')
    .factory('saAuthInterceptor', authInterceptor);

})();
