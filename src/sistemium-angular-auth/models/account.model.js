(function (ng) {
  'use strict';
  ng.module('sistemiumAngularAuth.models')
    .run(function (Schema, appConfig) {
      Schema.register({
        name: 'saAccount',
        endpoint: '/account',
        basePath: appConfig.authApiUrl,
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

})(angular);
