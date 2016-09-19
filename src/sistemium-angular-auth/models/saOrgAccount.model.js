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
