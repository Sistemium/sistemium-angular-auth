(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('sistemiumAngularAuth.config', [])
    .value('sistemiumAngularAuth.config', {
      debug: true
    });

  // Modules
  angular.module('sistemiumAngularAuth.services', []);
  angular.module('sistemiumAngularAuth',
    [
      'sistemium.schema',
      'sistemium.util',
      'ui.router',
      'LocalStorageModule',
      'sistemiumAngularAuth.config',
      'sistemiumAngularAuth.services',
      'sistemiumAngularAuth.models'
    ])
    .config(function ($httpProvider) {
      $httpProvider.interceptors.push('saAuthInterceptor');
    })
  ;

})(angular);
