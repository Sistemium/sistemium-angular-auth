'use strict';

(function() {

function TokenStore(localStorageService,$rootScope) {

  var KEY = 'access-token';

  var token = localStorageService.get(KEY);

  $rootScope.$on('logged-off',function(){
    token = undefined;
  });

  return {
    get: function () {
      return token;
    },

    save: function (newToken) {
      token = newToken;
      localStorageService.set (KEY,newToken);
    },

    destroy: function () {
      localStorageService.remove(KEY);
    }

  };

}

angular.module('sistemiumAngularAuth.models')
  .service('saToken', TokenStore);

})();
