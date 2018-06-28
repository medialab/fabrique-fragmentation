'use strict';

// Requiring module's CSS
require('angular-material/angular-material.min.css');

// Requiring angular-related modules that will spit things in the global scope
require('angular');
require('angular-animate');
require('angular-aria');
require('angular-sanitize');
require('angular-material');
require('angular-route');

// Making some modules global for the custom scripts to consume
var d3 = require('d3');
window.d3 = d3;

// Requiring own modules
require('./views/home.js');
require('./views/network.js');

// Declare app level module which depends on views, and components
angular.module('fabfrag', [
  'ngRoute',
  'ngSanitize',
  'ngMaterial',
  'fabfrag.home',
  'fabfrag.network'
]).
config(function($routeProvider, $mdThemingProvider) {
  $routeProvider.otherwise({redirectTo: '/'});

  // Material theme
  $mdThemingProvider.theme('default')
    .primaryPalette('brown', {
      'default': '400',   // by default use shade 400 from the pink palette for primary intentions
      'hue-1': '100',     // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600',     // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100'     // use shade A100 for the <code>md-hue-3</code> class
    })
    .accentPalette('teal', {
      'default': '300'
    })
    .warnPalette('orange')
    .backgroundPalette('brown', {
      'default': '50'
    })
})

// Filters
.filter('percent', function() {
  return function(d) {
    return Math.round(+d*100)+'%'
  }
})

// Services

// Directives
.directive('alignFragListItem', function(){
  return {
    restrict: 'E',
    templateUrl: 'components/alignFragListItem.html',
    scope: {
      item: '='
    }
  }
})

.directive('alignementChart', function($timeout, $filter){
  return {
    restrict: 'A',
    template: '<small layout="column" layout-align="center center" style="opacity:0.5;">loading</small>',
    scope: {
      alignement: '='
    },
    link: function($scope, el, attrs) {
      var container = el[0]

      $scope.$watch('alignement', redraw)
      window.addEventListener('resize', redraw)

			$scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      function redraw(){
        $timeout(function(){
	        container.innerHTML = '';

	        var settings = {}
	        settings.label_in_out_threshold = 0.5
	        settings.label_y_offset = 4
	        settings.label_font_family = 'Quicksand, sans-serif'
          settings.label_font_weight = '400'
          settings.label_font_size = '14px'

          // set the dimensions and margins of the graph
					var margin = {top: 1.5, right: 0, bottom: 1.5, left: 0},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;

					// set the ranges
					var y = d3.scaleLinear()
					          .range([height, 0])

					var x = d3.scaleLinear()
					          .range([0, width]);
					          
					var svg = d3.select(container).append('svg')
					    .attr('width', width + margin.left + margin.right)
					    .attr('height', height + margin.top + margin.bottom)
					  .append('g')
					    .attr('transform', 
					          'translate(' + margin.left + ',' + margin.top + ')');

				  // Scale the range of the data in the domains
					x.domain([0, 1])
				  y.domain([0, 1])

				  // append the rectangles for the bar chart
				  svg.append('rect')
				      .attr('width', function(d) {return x($scope.alignement) } )
				      .attr('y', y(1))
				      .attr('height', y(0))
				      .attr('fill', 'rgba(40, 30, 30, 0.8)')

				  // Text labels
				  var labels =svg.append('text')
				      .attr('x', function(d) {
				      	if (x($scope.alignement) > width * settings.label_in_out_threshold) {
				      		return x($scope.alignement) - 3 
				      	} else {
				      		return x($scope.alignement) + 3
				      	}
				      })
				      .attr('y', function(d) { return y(0.5) + settings.label_y_offset })
				      .text( function (d) { return $filter('number')($scope.alignement) })
              .attr('text-anchor', function(d,i) {
				      	if (x($scope.alignement) > width * settings.label_in_out_threshold) {
				      		return 'end' 
				      	} else {
				      		return 'start'
				      	}
				      })
              .attr('font-family', settings.label_font_family)
              .attr('font-weight', settings.label_font_weight)
              .attr('font-size', settings.label_font_size)
              .attr('fill', function(d,i) {
				      	if (x($scope.alignement) > width * settings.label_in_out_threshold) {
				      		return 'white' 
				      	} else {
				      		return 'black'
				      	}
				      })
        })
      }
    }
  }
})

.directive('fragmentationChart', function($timeout, $filter){
  return {
    restrict: 'A',
    template: '<small layout="column" layout-align="center center" style="opacity:0.5;">loading</small>',
    scope: {
      fragmentation: '='
    },
    link: function($scope, el, attrs) {
      var container = el[0]

      $scope.$watch('fragmentation', redraw)
      window.addEventListener('resize', redraw)

			$scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      function redraw(){
        $timeout(function(){
	        container.innerHTML = ''

	        var data = []
	        var label
	        for (label in $scope.fragmentation) {
	        	data.push({label:label, count:$scope.fragmentation[label]})
	        }
	        var max = d3.max(data, function(d){return d.count})
	        data.forEach(function(d){
        		d.display = Math.abs(d.count-max) < 0.01
	        })

	        var settings = {}
	        settings.column_spacing = 6
	        settings.bar_thickness = 2
	        settings.label_y_offset = -6
	        settings.label_font_family = 'Quicksand, sans-serif'
          settings.label_font_weight = '400'
          settings.label_font_size = '14px'

          // set the dimensions and margins of the graph
					var margin = {top: 18, right: 6, bottom: 18, left: 6},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;
					// set the ranges
					var y = d3.scaleLinear()
					          .range([0, height])

					var x = d3.scaleBand()
					          .range([0, width])
					          
					var svg = d3.select(container).append('svg')
					    .attr('width', width + margin.left + margin.right)
					    .attr('height', height + margin.top + margin.bottom)
					  .append('g')
					    .attr('transform', 
					          'translate(' + margin.left + ',' + margin.top + ')');

				  // Scale the range of the data in the domains
					x.domain(data.map(function(d, i) { return i }))
				  y.domain([0, 1])

				  var columns = svg.selectAll('.col')
				      .data(data)

				  var col = columns.enter().append('g')
				  
				  var bars = [0, 0.25, 0.5, 0.75, 1]
				  bars.forEach(function(b){
					  col.append('rect')
					  		.attr('class', 'col')
					      .attr('x', function(d, i) { return x(i) + settings.column_spacing/2 })
					      .attr('width', function(d) { return x.bandwidth() - settings.column_spacing } )
					      .attr('y', function(d) { return (height - y(d.count))/2 + b * y(d.count) - settings.bar_thickness / 2 })
					      .attr('height', function(d) { return settings.bar_thickness })
					      .attr('fill', '#F00')
				  })

				  // Text labels
				  var labels = columns.enter().append('text')
				      .attr('x', function(d, i) { return x(i) + x.bandwidth()/2 })
				      .attr('y', function(d) { return (height - y(d.count))/2 + settings.label_y_offset })
				      .text( function (d) { if (d.display) { return d.label } else { return '' } })
              .attr('text-anchor', 'middle')
							.attr('font-family', settings.label_font_family)
              .attr('font-weight', settings.label_font_weight)
              .attr('font-size', settings.label_font_size)
        })
      }
    }
  }
})

.directive('networkViewSelector', function($timeout){
  return {
    restrict: 'E',
    templateUrl: 'components/networkViewSelector.html',
    scope: {
      selectedView: '=',
      view: "="
    },
    link: function($scope, el, attrs) {
    }
  }
})
