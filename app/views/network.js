'use strict';

angular.module('fabfrag.network', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/network/:projet_id', {
    templateUrl: 'views/network.html',
    controller: 'NetworkCtrl'
  });
}])

.controller('NetworkCtrl', function($scope, $timeout, $location, $routeParams, dataStore) {
  	$scope.loading = true
  	$scope.selectedView = 'hemicycle'
    $scope.showArticles = false
    $scope.showDetails = false
    $scope.lectureFocus = 'none'

    dataStore.getCosignData().then(function(data){
      $timeout(function(){
        $scope.loading = false

        $scope.projetData = data[$routeParams.projet_id]
        $scope.projetIndex = dataStore.getIndexes().projets[$routeParams.projet_id]
        
        if ($scope.projetData) {
          $scope.structure = {
            projet: $routeParams.projet_id,
            lectures: d3.keys($scope.projetData).map(function(d){ return 'Lecture '+d })
          }
        } else {
          alert(':-(\nOups, le projet' + $routeParams.projet_id + ' ne se trouve pas dans les données...')
        }

        $scope.articles = d3.keys($scope.projetIndex.articles).map(function(article_id){
          var article = $scope.projetIndex.articles[article_id]
          return {
            id: article_id,
            shortName: article_id,
            alignement: article.alignement,
            amendements: article.amendements,
            fragmentation: article.fragmentation
          }
        })


        // Crunch the data
        console.log('projet data', $scope.projetData)

      })
    })

    $scope.$watch('lectureFocus', function(){
    })

    function updateNetwork() {
      $timeout(function(){

      })
    }

    /*$timeout(function(){
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
    }, 500)*/


});
