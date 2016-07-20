(function () {
  'use strict';

  //TODO models for auth module
  angular.module('sistemiumAngularAuth.models')

    .run(function (Schema, appConfig) {
      Schema.register({
        name: 'saProviderAccount',
        basePath: appConfig.apiUrl
      });
    });

})();
