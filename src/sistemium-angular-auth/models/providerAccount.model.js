'use strict';

(function () {

  //TODO models for auth module
  angular.module('sistemiumAngularAuth.models')

    .run(function (AuthSchema, saaAppConfig) {
      AuthSchema.register({
        name: 'saProviderAccount',
        basePath: saaAppConfig.apiUrl
      });
    });

})();
