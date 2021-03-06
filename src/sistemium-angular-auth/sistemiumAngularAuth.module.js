(function () {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Modules
  angular.module('sistemiumAngularAuth',
    [
      'sistemium',
      'sistemium.schema',
      'ui.router',
      'LocalStorageModule',
      'sistemiumAngularAuth.services',
      'sistemiumAngularAuth.models'
    ])
    .config(function ($httpProvider) {
      $httpProvider.interceptors.push('saAuthInterceptor');
    })
  ;

})();
