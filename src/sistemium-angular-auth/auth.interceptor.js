(function () {
  'use strict';

  function authInterceptor($q, $injector, saToken) {

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

        if (response.status === 401 || response.status === 403) {
          $injector.get('$state').go('debt.login');
          saToken.destroy();
        }
        return $q.reject(response);
      }

    };

  }

  angular.module('sistemiumAngularAuth')
    .factory('saAuthInterceptor', authInterceptor);

})();
