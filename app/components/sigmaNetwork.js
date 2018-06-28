'use strict';

/* Services */

angular.module('fabfrag.sigmaNetworkComponent', [])

  .directive('sigmaNetwork', function(
    $timeout
  ){
    return {
      restrict: 'E'
      ,templateUrl: 'components/sigmaNetwork.html'
      ,scope: {
        networkData: '=',
        suspendLayout: '=',             // Optional. Stops layout when suspendLayout becomes true
        startLayoutOnShow: '=',         // Optional. Starts layout when suspendLayout becomes false
        startLayoutOnLoad: '=',         // Optional. Default: true
        onNodeClick: '=',
        colorAttId: '=',
        sizeAttId: '=',
        nodeFilter: '=',                // Optional. Used to display only certain nodes (the others are present but muted)
        hardFilter: '=',                // Optional. When enabled, hidden nodes are completely removed
        getCameraState: '=',
        hideCommands: '=',
        enableLayout: '='
      }
      ,link: function($scope, el, attrs) {
        var sigma
        var renderer
        var networkDisplayThreshold = 1000

        $scope.nodesCount
        $scope.edgesCount
        $scope.tooBig = false
        $scope.loaded = false
        $scope.layout
        $scope.colorAtt
        $scope.sizeAtt

        $scope.stateOnSuspendLayout = ($scope.startLayoutOnLoad === undefined || $scope.startLayoutOnLoad)

        $scope.$watch('networkData.loaded', function(){
          if ( $scope.networkData.loaded ) {
            $scope.g = networkData.g.copy()
            $scope.loaded = true
            $scope.nodesCount = $scope.g.order
            $scope.edgesCount = $scope.g.size
            $scope.tooBig = $scope.nodesCount > networkDisplayThreshold
            updateColorFilter()
            updateSizeFilter()
            updateNodeAppearance()
            refreshSigma()
          }
        })

        $scope.$watch('colorAttId', function(){
          updateColorFilter()
          $timeout(updateNodeAppearance, 120)
        })

        $scope.$watch('sizeAttId', function(){
          updateSizeFilter()
          $timeout(updateNodeAppearance, 120)
        })

        $scope.$watch('onNodeClick', updateMouseEvents)

        $scope.$watch('suspendLayout', function(){
          if ($scope.layout === undefined) { return }
          if ($scope.suspendLayout === true) {
            $scope.stateOnSuspendLayout = $scope.layout.running
            $scope.stopLayout()
          } else if ($scope.suspendLayout === false) {
            if ($scope.startLayoutOnShow === true || $scope.stateOnSuspendLayout) {
              $scope.startLayout()
            }
          }
        })

        $scope.$watch('nodeFilter', updateNodeAppearance)

        $scope.displayLargeNetwork = function() {
          networkDisplayThreshold = $scope.nodesCount+1
          $scope.tooBig = false
          refreshSigma()
        }

        $scope.stopLayout = function() {
          if ($scope.layout === undefined) { return }
          $scope.layout.stop()
          if ($scope.layoutCacheKey) {
            layoutCache.store($scope.layoutCacheKey, $scope.g, $scope.layout.running)
          }
        }

        $scope.startLayout = function() {
          if ($scope.layout === undefined) { return }
          $scope.layout.start()
        }

        $scope.restoreOriginalLayout = function() {
          // $scope.g = networkData.g.copy()
          layoutCache.clear($scope.layoutCacheKey)
          if ($scope.layout === undefined) { return }
          $scope.layout.stop()
          $scope.g.nodes().forEach(function(nid){
            $scope.g.setNodeAttribute(nid, 'x', networkData.g.getNodeAttribute(nid, 'x'))
            $scope.g.setNodeAttribute(nid, 'y', networkData.g.getNodeAttribute(nid, 'y'))
          })
        }

        // These functions will be initialized at Sigma creation
        $scope.zoomIn = function(){}
        $scope.zoomOut = function(){}
        $scope.resetCamera = function(){}

        $scope.$on("$destroy", function(){
          if ($scope.layoutCacheKey) {
            layoutCache.store($scope.layoutCacheKey, $scope.g, $scope.layout.running)
          }
          if ($scope.layout) {
            $scope.layout.kill()
          }
          var sigma = undefined
          var renderer = undefined

        })

        /// Functions

        function updateColorFilter(){
          if ( $scope.g === undefined ) return
          if ($scope.colorAttId) {
            $scope.colorAtt = $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
          } else {
            $scope.colorAtt = undefined
          }
        }

        function updateSizeFilter(){
          if ( $scope.g === undefined ) return
          if ($scope.sizeAttId) {
            $scope.sizeAtt = $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]
          } else {
            $scope.sizeAtt = undefined
          }
        }

        function updateNodeAppearance() {
          if ($scope.networkData.loaded) {

            var g = $scope.g

            var settings = {}
            settings.default_node_color = '#969390'
            settings.default_node_color_muted = '#EEE'
            settings.default_edge_color = '#DDD'
            settings.default_edge_color_muted = '#FAFAFA'


            /// NODES

            // Filter
            var nodeFilter
            if ($scope.hardFilter) {
              g.dropNodes(g.nodes().filter(function(nid){
                return !$scope.nodeFilter(nid)
              }))

              nodeFilter = function(d){return d}
            } else {
              nodeFilter = $scope.nodeFilter || function(d){return d}
            }

            // Update positions from cache
            if ($scope.layoutCacheKey) {
              var wasRunning = layoutCache.recall($scope.layoutCacheKey, g)
              if (wasRunning && $scope.enableLayout && $scope.layout && !$scope.layout.running) {
                $scope.startLayout()
              } else if (wasRunning == false && $scope.layout && $scope.layout.running) {
                $scope.stopLayout()
              }
            }

            // Default / muted
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'z', 0)
              g.setNodeAttribute(nid, 'size', getSize(nid))
              g.setNodeAttribute(nid, 'color', settings.default_node_color_muted)
            })

            /// EDGES

            // Default / muted
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'z', 0)
              g.setEdgeAttribute(eid, 'color', settings.default_edge_color_muted)
            })

          }
        }

        function refreshSigma() {
          $timeout(function(){

            var settings = {}
            settings.default_ratio = 1.2

            var container = document.getElementById('sigma-div')
            if (!container) return
            container.innerHTML = ''
            renderer = new Sigma.WebGLRenderer(container, {
              labelFont: "Quicksand",
              labelWeight: '400',
              labelSize: 12
            })
            sigma = new Sigma($scope.g, renderer)

            $scope.zoomIn = function(){
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ratio: state.ratio / 1.5})
            }

            $scope.zoomOut = function(){
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ratio: state.ratio * 1.5})
            }

            $scope.resetCamera = function(){
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ratio: settings.default_ratio, x:0.5, y:0.5})
            }

            // Defaults to some unzoom
            var camera = renderer.getCamera()
            var state = camera.getState()
            camera.animate({ratio: settings.default_ratio, x:0.5, y:0.5})

            $scope.getCameraState = function() {
              return camera.getState()
            }

            if ($scope.layout) {
              $scope.layout.kill()
            }
            $scope.layout = new Graph.library.FA2Layout($scope.g, {
              settings: {
                barnesHutOptimize: g.order > 2000,
                strongGravityMode: true,
                gravity: 0.05,
                scalingRatio: 10,
                slowDown: 1 + Math.log(g.order)
              }
            });
            if (
              ($scope.startLayoutOnLoad || $scope.startLayoutOnLoad === undefined)
              && (!$scope.suspendLayout || $scope.suspendLayout === undefined)
            ) {
              $scope.layout.start()
            }

            updateMouseEvents()

          })
        }

        function updateMouseEvents() {
          if (sigma === undefined || renderer === undefined) {
            return
          }

          if ($scope.onNodeClick !== undefined) {
            renderer.on('clickNode', function(e){
              $timeout(function(){
                $scope.onNodeClick(e.node)
              })
            })
            renderer.on('overNode', function(e){
              el[0].classList.add('pointable')
            })
            renderer.on('outNode', function(e){
              el[0].classList.remove('pointable')
            })

          }
        }

      }
    }
  })
