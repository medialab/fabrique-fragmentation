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

  Promise.all([
    dataStore.getNosDeputesData(),
    dataStore.getCosignData()
  ]).then(function(r){
    $timeout(function(){
      $scope.indexes = dataStore.getIndexes()

      // Data from Nos Députés
      $scope.nosDeputesData = r[0]
      console.log('Nos Deputes Data', r[0])

      // Data about cosignatures
      $scope.items = []
      var projet_id
      for (projet_id in r[1]) {
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
