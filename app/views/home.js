'use strict';

angular.module('fabfrag.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', function($scope, $timeout, $location) {
  	$scope.loading = true
  	
    $timeout(function(){
      $scope.loading = false

      // Dummy data
      $scope.items = [
        {
          alignement: 0.6,
          fragmentation: {
            A: 0,
            B: 0.1,
            C: 0,
            D: 0.3
          },
          shortName: 'Loi Maquereau',
          tags: [
            'tag 1',
            'tag 2'
          ],
          dates: {
            depot: '2018-01-28',
            promulgation: '2018-06-28'
          }
        },
        {
          alignement: 0.3,
          fragmentation: {
            A: 1.0,
            B: 0.05,
            C: 0.01,
            D: 0.02
          },
          shortName: 'Loi Sardine',
          tags: [
          ],
          dates: {
            depot: '2018-01-28',
            promulgation: '2018-06-28'
          }
        }
      ]



    }, 500)


});
