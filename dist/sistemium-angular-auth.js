'use strict';

(function () {

  angular.module('sistemiumAngularAuth.models', ['sistemiumAngularAuth.services']);

})();

'use strict';

(function () {

  angular.module('sistemiumAngularAuth.services', ['sistemium']);

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

'use strict';

(function () {

  angular.module('sistemiumAngularAuth.models')
    .run(function (AuthSchema) {
      AuthSchema.register({
        name: 'saAccount',

        relations: {
          hasMany: {
            saProviderAccount: {
              localField: 'providers',
              foreignKey: 'accountId'
            },
            saOrgAccount: {
              localField: 'orgAccounts',
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

  angular.module('sistemiumAngularAuth.models')
    .run(function (AuthSchema) {
      AuthSchema.register({

        name: 'saOrgAccount',

        relations: {
          hasOne: {
            saAccount: {
              localField: 'account',
              localKey: 'accountId'
            }
          },
          hasMany: {
            saOrgAccountRole: {
              localField: 'orgAccountRoles',
              foreignKey: 'orgAccountId'
            }
          }
        }

      });
    })
  ;

})();

'use strict';

(function () {

  angular.module('sistemiumAngularAuth.models')
    .run(function (AuthSchema) {
      AuthSchema.register({

        name: 'saOrgAccountRole',

        relations: {
          hasOne: {
            saOrgAccount: {
              localField: 'orgAccount',
              localKey: 'orgAccountId'
            },
            saRole: {
              localField: 'role',
              localKey: 'roleId'
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

    .run(function (AuthSchema) {
      AuthSchema.register({

        name: 'saProviderAccount',

        relations: {
          hasOne: {
            saAccount: {
              localField: 'account',
              localKey: 'accountId'
            }
          }
        }

      });
    });

})();

'use strict';

(function () {

  angular.module('sistemiumAngularAuth.models')
    .run(function (AuthSchema) {
      AuthSchema.register({
        name: 'saRole',

        relations: {
          hasMany: {
            saOrgAccountRole: {
              localField: 'orgAccountRoles',
              foreignKey: 'roleId'
            }
          }
        }

      });
    })
  ;

})();

'use strict';

(function () {

  function saToken(localStorageService, $rootScope) {

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
    .service('saToken', saToken);

})();

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

'use strict';

(function () {

  function saAuth($location, $http, $q, saToken, Util, AuthSchema, $rootScope) {

    var loggedOffEventName = 'logged-off';
    var loggedInEventName = 'logged-in';
    var loggingInEventName = 'logging-in';
    var rolesProperty = 'roles';

    var safeCb = Util.safeCb;

    var Auth = {};
    var currentUser = {};
    var userRoles;

    var Account = AuthSchema.model('saAccount');
    var OrgAccount = AuthSchema.model('saOrgAccount');
    var OrgAccountRole = AuthSchema.model('saOrgAccountRole');


    function setCurrentUser () {

      var q = Account.find('me')
        .then(function (account) {

          return Account.loadRelations(account)
            .then(function () {
              return Auth.config.loadRoles ? $q.all(_.map(account.orgAccounts, function (orgAccount) {
                return OrgAccount.loadRelations(orgAccount)
                  .then(function(){
                    return $q.all(_.map(orgAccount.orgAccountRoles, function(orgAccountRole) {
                      return OrgAccountRole.loadRelations(orgAccountRole, 'saRole');
                    }));
                  });
              })) : account;
            })
            .then(function () {
              currentUser = account;
              console.log(loggedInEventName, account);
              $rootScope.$broadcast(loggedInEventName, currentUser);
              return account;
            });

        });

      $rootScope.$broadcast(loggingInEventName, q);
      return q;

    }

    function configurableAuth(config) {

      Auth.config = config;

      if (config.Account) {
        Account = config.Account;
      }

      if (saToken.get() && $location.path() !== '/logout') {
        currentUser = setCurrentUser();
      }

      return Auth;
    }


    angular.extend(Auth, {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional, function(error, user)
       * @return {Promise}
       */
      login: function (token, callback) {

        token = token || Auth.getToken();

        return $http.get(Auth.config.authUrl + '/api/token/' + token, {
          headers: {
            'authorization': token
          }
        })
          .then(function () {

            saToken.save(token);

            var q = setCurrentUser();

            q.catch(function (err) {
              console.error('saAuth.login:', err);
            });

            return q;

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
            currentUser = setCurrentUser();
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

        return $q.when(currentUser)
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
        // TODO test if is admin
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

    });

    return configurableAuth;
  }

  angular.module('sistemiumAngularAuth.services')
    .factory('saAuth', saAuth);

})();
