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
    $scope.showArticles = false
    $scope.showDetails = false
    $scope.lectureFocus = 'none'

    $timeout(function(){
      $scope.loading = false

      // Dummy data
      $scope.data = {
        projet: 'PROJET DE LOI',
        lectures: [
          'LECTURE 1',
          'LECTURE 2',
          'LECTURE 3'
        ]
      }

      // Dummy data
      $scope.articles = [
        {
          alignement: 0.6,
          fragmentation: {
            A: 0,
            B: 0.1,
            C: 0,
            D: 0.3
          },
          shortName: 'Article X',
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
          shortName: 'Article Y',
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
