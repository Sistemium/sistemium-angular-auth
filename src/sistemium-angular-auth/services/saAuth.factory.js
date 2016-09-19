'use strict';

(function () {

  function saAuth($location,
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

    var Auth = {};

    var Account = AuthSchema.model('saAccount');
    var OrgAccount = AuthSchema.model('saOrgAccount');
    var OrgAccountRole = AuthSchema.model('saOrgAccountRole');

    function configurableAuth(config) {

      Auth.config = config;

      if (config.Account) {
        Account = config.Account;
      }

      if (saToken.get() && $location.path() !== '/logout') {

        currentUser = Account.find('me')
          .then(function (account) {

            return Account.loadRelations(account)
              .then(function () {
                return config.loadRoles ? $q.all(_.map(account.orgAccounts, function (orgAccount) {
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
                console.log('logged-in', account);
                $rootScope.$broadcast(loggedInEventName);
                return account;
              });

          });
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

            var q = Account.find('me')
              .then(function (account) {
                currentUser = account;
                safeCb(callback)(null, currentUser);
                $rootScope.$broadcast('logged-in');
                return currentUser;
              });

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
