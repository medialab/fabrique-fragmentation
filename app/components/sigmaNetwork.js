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
        network: '=',
        suspendLayout: '=',             // Optional. Stops layout when suspendLayout becomes true
        startLayoutOnShow: '=',         // Optional. Starts layout when suspendLayout becomes false
        startLayoutOnLoad: '=',         // Optional. Default: true
        onNodeClick: '=',
        nodeFilter: '=',                // Optional. Used to display only certain nodes (the others are present but muted)
        hardFilter: '=',                // Optional. When enabled, hidden nodes are completely removed
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

        $scope.$watch('network', function(){
          if ($scope.network) {
            $scope.g = $scope.network.copy()
            $scope.loaded = true
            $scope.nodesCount = $scope.g.order
            $scope.edgesCount = $scope.g.size
            $scope.tooBig = $scope.nodesCount > networkDisplayThreshold
            refreshSigma()
          }
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
              labelSize: 16
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

            if ($scope.layout) {
              $scope.layout.kill()
            }
            $scope.layout = new Graph.library.FA2Layout($scope.g, {
              settings: {
                barnesHutOptimize: $scope.g.order > 2000,
                strongGravityMode: true,
                gravity: 0.05,
                scalingRatio: 10,
                slowDown: 1 + Math.log($scope.g.order)
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
