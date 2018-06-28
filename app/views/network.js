'use strict';

angular.module('fabfrag.network', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/network/', {
    templateUrl: 'views/network.html',
    controller: 'NetworkCtrl'
  });
}])

.controller('NetworkCtrl', function($scope, $timeout, $location) {
  	$scope.loading = true
  	$scope.selectedView = 'hemicycle'
    
    $timeout(function(){
      $scope.loading = false
      $scope.showDetails = false

      // Dummy data
      $scope.data = {
        projet: 'PROJET DE LOI',
        lectures: [
          'LECTURE 1',
          'LECTURE 2',
          'LECTURE 3'
        ]
      }
    }, 500)


});
