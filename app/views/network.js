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
    $scope.coordinates = {alignement:{}, hemicycle:{}, reseau:{}, fragmentation:{}}
    $scope.layoutVersion = 0
    $scope.layoutTarget

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

        computeNetwork()

      })
    })
    dataStore.getCosignData().then(function(data){
      
    })

    $scope.$watch('lectureFocus', computeNetwork)
    $scope.$watch('articleFocus', computeNetwork)
    $scope.$watch('selectedView', updateNetwork)

    function updateNetwork() {
      if ($scope.network) {
        $timeout(function(){
          console.log('VIEW', $scope.selectedView)

          var g = $scope.network
          var coordinates = $scope.coordinates[$scope.selectedView]

          // Update network
          if ($scope.selectedView == 'hemicycle') {
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'hidden', true )
            })
          } else {
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'hidden', false )
            })
          }
          window.g = g

          // Update coordinates
          $scope.layoutTarget = {}
          g.nodes().forEach(function(nid){
            var c = coordinates[nid]
            $scope.layoutTarget[nid] = c
          })

          $scope.layoutVersion++
        })
      }
    }

    function computeNetwork() {
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
                  place: $scope.nosDeputesData.deputes[p.id].place_en_hemicycle,
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
        g.addEdge(c.source, c.target, {count:c.count, weight:c.count, color: '#E6E6E6', size: size})
      })

      // Set node sizes
      g.nodes().forEach(function(nid){
        g.setNodeAttribute(nid, 'size', 6)
      })

      // Compute coordinates: ALIGNEMENT
      var groupes_index = {}
      g.nodes().forEach(function(nid){
        var groupe = g.getNodeAttribute(nid, 'groupe')
        groupes_index[groupe] = (groupes_index[groupe] || 0) + 1
      })
      var totalCount = 0
      var groupes = d3.keys(groupes_index).map(function(groupe){
        var count = groupes_index[groupe]
        totalCount += count
        return {
          acronyme: groupe,
          count: count,
          rank: $scope.nosDeputesData.groupes_byAcro[groupe].order
        }
      })
      groupes.sort(function(a, b){
        return a.rank - b.rank
      })
      groupes_index = {}
      var currentCount = 0
      groupes.forEach(function(groupe){
        groupe.percent = (currentCount + groupe.count/2) / totalCount
        currentCount += groupe.count
        groupes_index[groupe.acronyme] = groupe
      })
      g.nodes().forEach(function(nid){
        var groupe = groupes_index[g.getNodeAttribute(nid, 'groupe')]
        var angle = Math.PI * (1 - groupe.percent)
        var x = 250 * Math.cos(angle)
        var y = 250 * Math.sin(angle)
        $scope.coordinates.alignement[nid] = {x:x, y:y}
      })

      // Compute coordinates: HEMICYCLE
      g.nodes().forEach(function(nid){
        var place = $scope.nosDeputesData.places[g.getNodeAttribute(nid, 'place')]
        $scope.coordinates.hemicycle[nid] = {x:10*place.x, y:-10*place.y}
        g.setNodeAttribute(nid, 'x', place.x)
        g.setNodeAttribute(nid, 'y', -place.y)
      })


      // Compute coordinates: RESEAU
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
      g.nodes().forEach(function(nid){
        $scope.coordinates.reseau[nid] = { x:g.getNodeAttribute(nid, 'x'), y:g.getNodeAttribute(nid, 'y') }
      })

      // Compute coordinates: FRAGMENTATION
      // TODO

      $scope.network = g

      updateNetwork()
    }

});
