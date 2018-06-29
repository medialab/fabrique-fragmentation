'use strict';

angular.module('fabfrag.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', function($scope, $timeout, $location, dataStore) {
	$scope.loading = true

  dataStore.getCosignData().then(function(data){
    $timeout(function(){
      $scope.indexes = dataStore.getIndexes()

      $scope.items = []
      var projet_id
      for (projet_id in data) {
        var projet_index = $scope.indexes.projets[projet_id]
        $scope.items.push({
          id: projet_id,
          shortName: projet_id,
          date: {
            depot: 'à faire',
            promulgation: 'à faire'
          },
          alignement: projet_index.alignement,
          amendements: projet_index.amendements,
          fragmentation: projet_index.fragmentation
        })

      }
      $scope.loading = false
    })
  })

})
