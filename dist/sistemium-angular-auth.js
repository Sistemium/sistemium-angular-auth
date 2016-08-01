'use strict';

(function () {

  angular.module('sistemiumAngularAuth.models', ['sistemiumAngularAuth.services']);

})();

(function () {
  'use strict';

  angular.module('sistemiumAngularAuth.services', ['sistemium.schema']);

})();

(function () {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Modules
  angular.module('sistemiumAngularAuth',
    [
      'sistemium',
      'sistemium.schema',
      'sistemium.util',
      'ui.router',
      'LocalStorageModule',
      'sistemiumAngularAuth.services',
      'sistemiumAngularAuth.models'
    ])
    .config(function ($httpProvider) {
      $httpProvider.interceptors.push('saAuthInterceptor');
    })
  ;

})();

(function () {
  'use strict';

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

'use strict';

(function () {

  angular.module('sistemiumAngularAuth.models')
    .run(function (AuthSchema, saaAppConfig) {
      AuthSchema.register({
        name: 'saAccount',
        endpoint: '/account',
        basePath: saaAppConfig.authApiUrl,
        relations: {
          hasMany: {
            providerAccount: {
              localField: 'providers',
              foreignKey: 'accountId'
            }
          }
        }
      });
    })
  ;

})();

'use strict';

(function () {

  //TODO models for auth module
  angular.module('sistemiumAngularAuth.models')

    .run(function (AuthSchema, saaAppConfig) {
      AuthSchema.register({
        name: 'saProviderAccount',
        basePath: saaAppConfig.apiUrl
      });
    });

})();

'use strict';

(function () {

  function TokenStore(localStorageService, $rootScope) {

    var KEY = 'access-token';

    var token = localStorageService.get(KEY);

    $rootScope.$on('logged-off', function () {
      token = undefined;
    });

    return {
      get: function () {
        return token;
      },

      save: function (newToken) {
        token = newToken;
        localStorageService.set(KEY, newToken);
      },

      destroy: function () {
        localStorageService.remove(KEY);
      }

    };

  }

  angular.module('sistemiumAngularAuth.models')
    .service('saToken', TokenStore);

})();

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

'use strict';

(function () {

  function AuthService($location,
                       $http,
                       $q,
                       saToken,
                       Util,
                       AuthSchema,
                       $rootScope) {

    var safeCb = Util.safeCb;
    var currentUser = {};
    var userRoles;
    var rolesProperty = 'roles';
    var loggedOffEventName = 'logged-off';
    var loggedInEventName = 'logged-in';

    var Account = AuthSchema.model('saAccount');


    if (saToken.get() && $location.path() !== '/logout') {
      currentUser = Account.find('me');
      currentUser.then(function (res) {
        Account.loadRelations(res, ['saProviderAccount']).then(function () {
          currentUser = res;
        });
        console.log('logged-in', res);
        $rootScope.$broadcast(loggedInEventName);
      });
    }

    var Auth = {

      loginWithMobileNumber: function (mobileNumber) {

        return $http.get(Auth.config.phaUrl + mobileNumber);

      },

      authWithSmsCode: function (id, code) {

        return $http.get(Auth.config.authUrl + '/auth/pha/' + id + '/' + code)
          .then(function (res) {
            var token = res.headers('x-access-token');
            return {
              token: token,
              user: res.data
            };
          });

      },

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional, function(error, user)
       * @return {Promise}
       */
      login: function (token, callback) {
        return $http.get(Auth.config.authUrl + '/api/token/' + token, {
            headers: {
              'authorization': token
            }
          })
          .then(function () {
            //var currentUserId = user.data && user.data.tokenInfo && user.data.tokenInfo.id;
            saToken.save(token);

            Account.find('me')
              .then(function (account) {
                currentUser = account;
                safeCb(callback)(null, currentUser);
                $rootScope.$broadcast('logged-in');
                return currentUser;
              })
              .catch(function (err) {
                console.log(err);
              })
            ;

          })
          .catch(function (err) {
            Auth.logout();
            safeCb(callback)(err.data);
            return $q.reject(err.data);
          });
      },

      /**
       * Delete access token and user info
       */
      logout: function () {
        saToken.destroy();
        currentUser = {};
        $rootScope.$broadcast(loggedOffEventName);
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional, function(error, user)
       * @return {Promise}
       */
      createUser: function (user, callback) {
        return Account.create(user).then(
          function (data) {
            saToken.save(data.token);
            currentUser = Account.find('me');
            return safeCb(callback)(null, user);
          },
          function (err) {
            Auth.logout();
            return safeCb(callback)(err);
          });
      },

      /**
       * Gets all available info on a user
       *   (synchronous|asynchronous)
       *
       * @param  {Function|*} callback - optional, funciton(user)
       * @return {Object|Promise}
       */
      getCurrentUser: function (callback) {
        if (arguments.length === 0) {

          return currentUser;
        }

        var value = (currentUser.hasOwnProperty('$$state')) ?
          currentUser : currentUser;
        return $q.when(value)
          .then(function (user) {
            safeCb(callback)(user);
            return user;
          }, function () {
            safeCb(callback)({});
            return {};
          });
      },

      /**
       * Check if a user is logged in
       *   (synchronous|asynchronous)
       *
       * @param  {Function|*} callback - optional, function(is)
       * @return {Bool|Promise}
       */
      isLoggedIn: function (callback) {

        if (arguments.length === 0) {
          return currentUser.hasOwnProperty(rolesProperty);
        }

        return Auth.getCurrentUser(null)
          .then(function (user) {
            var is = user.hasOwnProperty(rolesProperty);
            safeCb(callback)(is);
            return is;
          });
      },

      /**
       * Check if a user has a specified role or higher
       *   (synchronous|asynchronous)
       *
       * @param  {String}     role     - the role to check against
       * @param  {Function|*} callback - optional, function(has)
       * @return {Bool|Promise}
       */
      hasRole: function (role, callback) {
        var hasRole = function (r, h) {
          userRoles = Auth.config.userRoles || [];
          return userRoles.indexOf(r) >= userRoles.indexOf(h);
        };

        if (arguments.length < 2) {
          return hasRole(currentUser.role, role);
        }

        return Auth.getCurrentUser(null)
          .then(function (user) {
            var has = (user.hasOwnProperty(rolesProperty)) ?
              hasRole(user.roles, role) : false;
            safeCb(callback)(has);
            return has;
          });
      },

      /**
       * Check if a user is an admin
       *   (synchronous|asynchronous)
       *
       * @param  {Function|*} callback - optional, function(is)
       * @return {Bool|Promise}
       */
      isAdmin: function () {
        return Auth.hasRole
          .apply(Auth, [].concat.apply(['admin'], arguments));
      },

      /**
       * Get auth token
       *
       * @return {String} - a token string used for authenticating
       */
      getToken: function () {
        return saToken.get();
      }
    };

    return function (config) {
      Auth.config = config;
      return Auth;
    };
  }

  angular.module('sistemiumAngularAuth.services')
    .factory('saAuth', AuthService);

})();
