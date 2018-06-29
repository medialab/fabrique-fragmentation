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
    $scope.lectureFocus = ''
    $scope.articleFocus = ''

    Promise.all([
      dataStore.getNosDeputesData(),
      dataStore.getCosignData()
    ]).then(function(r){
      $timeout(function(){
        $scope.loading = false

        // Data from Nos Députés
        $scope.nosDeputesData = r[0]
        console.log('Nos Deputes Data', r[0])

        // Data about cosignatures
        $scope.projetData = r[1][$routeParams.projet_id]
        $scope.projetIndex = dataStore.getIndexes().projets[$routeParams.projet_id]
        console.log('DATA', $scope.projetData)
        console.log('INDEX', $scope.projetIndex)
        
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

        updateNetwork()

      })
    })
    dataStore.getCosignData().then(function(data){
      
    })

    $scope.$watch('lectureFocus', updateNetwork)
    $scope.$watch('articleFocus', updateNetwork)

    function updateNetwork() {
      $timeout(function(){
        if ($scope.projetData == undefined || $scope.projetIndex == undefined) return

        var parlementaires = {}
        var cosignatures = {}
        var lectures = $scope.lectureFocus == '' ? d3.keys($scope.projetData) : [$scope.lectureFocus]
        var articles = $scope.articleFocus == '' ? d3.keys($scope.projetIndex.articles) : [$scope.articleFocus]
        lectures.forEach(function(lecture_id){
          articles.forEach(function(article_id){
            var articleData = $scope.projetData[lecture_id][article_id]
            if (articleData) {
              articleData.sign_amend.forEach(function(cosignataires){
                // Register parlementaires
                cosignataires.forEach(function(p){
                  parlementaires[p.id] = parlementaires[p.id] || {
                    id: p.id,
                    label: $scope.nosDeputesData.deputes[p.id].nom,
                    groupe: p.groupe,
                    color:'rgb(' + $scope.nosDeputesData.groupes_byAcro[p.groupe].couleur + ')',
                    count: 0
                  }
                  parlementaires[p.id].count++
                })

                // Register links
                cosignataires.forEach(function(p1){
                  cosignataires.forEach(function(p2){
                    if (p1.id > p2.id) {
                      var linkid = p1.id + '-' + p2.id
                      cosignatures[linkid] = cosignatures[linkid] || {source: p1.id, target: p2.id, count:0}
                      cosignatures[linkid].count++
                    }
                  })
                })
              })
            }
          })
        })

        var g = new Graph({type: 'undirected'})
        g.addNodesFrom(parlementaires)

        d3.keys(cosignatures).forEach(function(linkid){
          var c = cosignatures[linkid]
          var size = 0.5 + 4.5 * (1 - 1/Math.pow(c.count, 1/4))
          g.addEdge(c.source, c.target, {count:c.count, weight:c.count, color: '#CCC', size: size})
        })

        // Add random colors and positions
        g.nodes().forEach(function(nid){
          g.setNodeAttribute(nid, 'x', 100*Math.random())
          g.setNodeAttribute(nid, 'y', 100*Math.random())
          g.setNodeAttribute(nid, 'size', 6)
        })

        // FA2(g, {iterations: 100})
        FA2.assign(g, {
          iterations: 30,
          settings: {
            barnesHutOptimize: false,
            strongGravityMode: true,
            gravity: 0.1,
            scalingRatio: 100,
            slowDown: 1
          }
        })



        console.log(g, g.order, g.size)

        $scope.network = g

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
