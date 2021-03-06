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
