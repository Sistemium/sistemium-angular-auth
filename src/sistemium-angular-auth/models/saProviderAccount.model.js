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
