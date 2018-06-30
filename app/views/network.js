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
            lectures: d3.keys($scope.projetData)
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

          var g = $scope.network
          var coordinates = $scope.coordinates[$scope.selectedView]

          // Update network
          if ($scope.selectedView == 'alignement') {
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'hidden', false )
              g.setEdgeAttribute(eid, 'color', '#AAA')
            })
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'size', 5)
            })
          } else if ($scope.selectedView == 'hemicycle') {
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'hidden', true )
              g.setEdgeAttribute(eid, 'color', '#E6E6E6')
            })
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'size', 5)
            })
          } else if ($scope.selectedView == 'reseau') {
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'hidden', false )
              g.setEdgeAttribute(eid, 'color', '#E6E6E6' )
            })
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'size', 5)
            })
          } else if ($scope.selectedView == 'fragmentation') {
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'hidden', g.getNodeAttribute(g.source(eid), 'groupe') != g.getNodeAttribute(g.target(eid), 'groupe') )
              g.setEdgeAttribute(eid, 'color', '#E6E6E6' )
            })
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'size', 4)
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
        g.addEdge(c.source, c.target, {count:c.count, weight:c.count, size: size})
      })

      // Compute coordinates: ALIGNEMENT
      var groupes_index = {}
      g.nodes().forEach(function(nid){
        var groupe = g.getNodeAttribute(nid, 'groupe')
        groupes_index[groupe] = (groupes_index[groupe] || 0) + 1
      })
      var tweakCount = function(count){ return Math.sqrt(count) }
      var totalCount = 0
      var groupes = d3.keys(groupes_index).map(function(groupe){
        var count = groupes_index[groupe]
        totalCount += tweakCount(count)
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
        var tweakedCount = tweakCount(groupe.count)
        groupe.percent = (currentCount + tweakedCount/2) / totalCount
        currentCount += tweakedCount
        groupes_index[groupe.acronyme] = groupe
      })
      g.nodes().forEach(function(nid){
        var groupe = groupes_index[g.getNodeAttribute(nid, 'groupe')]
        var angleMin = 1.2 * Math.PI
        var angleMax = -0.2 * Math.PI
        var angle = angleMin - groupe.percent * (angleMin - angleMax)
        var jitterAngle = Math.random() * 2 * Math.PI
        var jitterRadius = Math.random() * 3 * Math.sqrt(groupe.count)
        var x = 250 * Math.cos(angle) + jitterRadius * Math.cos(jitterAngle)
        var y = 250 * Math.sin(angle) + jitterRadius * Math.sin(jitterAngle)
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
      if (g.order > 1 || g.size > 0) {
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
      }
      g.nodes().forEach(function(nid){
        $scope.coordinates.reseau[nid] = { x:g.getNodeAttribute(nid, 'x'), y:g.getNodeAttribute(nid, 'y') }
      })

      // Compute coordinates: FRAGMENTATION
      groupes.forEach(function(groupe){
        var sample = g.nodes().map(function(nid){
          var n = g.getNodeAttributes(nid)
          n.id = nid
          return n
        }).filter(function(n){
          return n.groupe == groupe.acronyme
        })
        var rl
        var angle
        if (sample.length > 1) {
          rl = calcLinear(sample, 'x', 'y', d3.min(sample, function(n){return n.x}), d3.min(sample, function(n){return n.y}))
          angle = Math.atan2(rl.ptB.y - rl.ptA.y, rl.ptB.x - rl.ptA.x)
        } else {
          angle = 0
        }
        sample.forEach(function(n){
          var a = Math.atan2(n.y, n.x)
          var r = Math.sqrt(Math.pow(n.x, 2) + Math.pow(n.y, 2))
          var a2 = a - angle + Math.PI / 2
          n.x = r * Math.cos(a2)
          n.y = r * Math.sin(a2)
        })
        var meanX = d3.mean(sample, function(n){ return n.x })
        var meanY = d3.mean(sample, function(n){ return n.y })
        sample.forEach(function(n){
          n.x = n.x - meanX + 50000 * groupes_index[n.groupe].percent
          n.y = (n.y - meanY) * 3
          $scope.coordinates.fragmentation[n.id] = {x:n.x, y:n.y}
        })
      })

      // Default: hemicycle
      g.nodes().forEach(function(nid){
        var coord = $scope.coordinates.hemicycle[nid]
        g.setNodeAttribute(nid, 'x', coord.x)
        g.setNodeAttribute(nid, 'y', coord.y)
      })

      $scope.network = g

      updateNetwork()

      /// Computing functions

      // From https://bl.ocks.org/HarryStevens/be559bed98d662f69e68fc8a7e0ad097
      // Calculate a linear regression from the data

      // Takes 5 parameters:
      // (1) Your data
      // (2) The column of data plotted on your x-axis
      // (3) The column of data plotted on your y-axis
      // (4) The minimum value of your x-axis
      // (5) The minimum value of your y-axis

      // Returns an object with two points, where each point is an object with an x and y coordinate

      function calcLinear(data, x, y, minX, minY){
        /////////
        //SLOPE//
        /////////

        // Let n = the number of data points
        var n = data.length;

        // Get just the points
        var pts = [];
        data.forEach(function(d,i){
          var obj = {};
          obj.x = d[x];
          obj.y = d[y];
          obj.mult = obj.x*obj.y;
          pts.push(obj);
        });

        // Let a equal n times the summation of all x-values multiplied by their corresponding y-values
        // Let b equal the sum of all x-values times the sum of all y-values
        // Let c equal n times the sum of all squared x-values
        // Let d equal the squared sum of all x-values
        var sum = 0;
        var xSum = 0;
        var ySum = 0;
        var sumSq = 0;
        pts.forEach(function(pt){
          sum = sum + pt.mult;
          xSum = xSum + pt.x;
          ySum = ySum + pt.y;
          sumSq = sumSq + (pt.x * pt.x);
        });
        var a = sum * n;
        var b = xSum * ySum;
        var c = sumSq * n;
        var d = xSum * xSum;

        // Plug the values that you calculated for a, b, c, and d into the following equation to calculate the slope
        // slope = m = (a - b) / (c - d)
        var m = (a - b) / (c - d);

        /////////////
        //INTERCEPT//
        /////////////

        // Let e equal the sum of all y-values
        var e = ySum;

        // Let f equal the slope times the sum of all x-values
        var f = m * xSum;

        // Plug the values you have calculated for e and f into the following equation for the y-intercept
        // y-intercept = b = (e - f) / n
        var b = (e - f) / n;

        // return an object of two points
        // each point is an object with an x and y coordinate
        return {
          ptA : {
            x: minX,
            y: m * minX + b
          },
          ptB : {
            y: minY,
            x: (minY - b) / m
          }
        }
      }
    }

});
