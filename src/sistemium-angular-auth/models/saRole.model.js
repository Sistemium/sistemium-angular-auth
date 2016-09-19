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
