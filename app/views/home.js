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

      // Data about cosignatures
      $scope.items = []
      var projet_id
      for (projet_id in r[1]) {
        var projet = $scope.nosDeputesData.projets[projet_id]
        var projet_index = $scope.indexes.projets[projet_id]
        $scope.items.push({
          id: projet_id,
          shortName: projet ? projet.short_title : projet_id,
          description1: projet ? projet.law_name : undefined,
          description2: projet ? projet.themes.join(', ') : undefined,
          dates: {
            depot: projet ? projet.beginning : undefined,
            promulgation: projet ? projet.end : undefined
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
