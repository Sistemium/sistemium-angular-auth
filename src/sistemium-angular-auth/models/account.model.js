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
