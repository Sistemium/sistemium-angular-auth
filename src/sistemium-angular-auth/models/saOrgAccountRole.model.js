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
