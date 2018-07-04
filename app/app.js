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
window.Sigma = require('sigma/endpoint');
window.Sigma.animate = require('sigma/animate');
window.Graph = require('graphology');
window.Graph.library = require('graphology-library/browser');
window.FA2 = require('graphology-layout-forceatlas2');

// Requiring own modules
require('./views/home.js');
require('./views/network.js');
require('./components/sigmaNetwork.js');

// Declare app level module which depends on views, and components
angular.module('fabfrag', [
  'ngRoute',
  'ngSanitize',
  'ngMaterial',
  'fabfrag.home',
  'fabfrag.network',
  'fabfrag.sigmaNetworkComponent'
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
    .backgroundPalette('grey', {
      'default': '50'
    })
})

// Filters
.filter('percent', function() {
  return function(d) {
    return Math.round(+d*100)+'%'
  }
})

.filter('toUpperCase', function() {
  return function(d) {
    return d.toUpperCase()
  }
})

// Services
.factory('dataStore', function($http, $timeout, dataCruncher){
  var ns = {}     // namespace

  ns.cosignData = undefined
  ns.indexes = undefined
  ns.nosdeputesData = undefined

  ns.getNosDeputesData = function(){
  	return new Promise(function(resolve, reject) {
	  	if (ns.nosdeputesData) {
	  		resolve(ns.nosdeputesData)
	  	} else {
	  		Promise.all([
	  			$http.get('https://www.nosdeputes.fr/organismes/groupe/json'),
	  			$http.get('https://2012-2017.nosdeputes.fr/organismes/groupe/json'),
	  			$http.get('https://www.nosdeputes.fr/deputes/json'),
	  			$http.get('https://2012-2017.nosdeputes.fr/deputes/json'),
	  			$http.get('data/places.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_0.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_1.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_2.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_3.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_4.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_5.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_6.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_7.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_8.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_9.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_10.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_11.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_12.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_13.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_14.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_15.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_16.json'),
	  			$http.get('https://www.lafabriquedelaloi.fr/api/dossiers_17.json')
	  		]).then(function(r){
	  			ns.nosdeputesData = {groupesData: {current:r[0].data, 2012:r[1].data}, deputesData: {current:r[2].data, 2012:r[3].data}, places:r[4].data, projetsData:[]}
	  			var i
	  			for (i=0; i<=17; i++){
	  				ns.nosdeputesData.projetsData.push(r[5+i].data)
	  			}
	  			dataCruncher.consolidateNosDeputesData(ns.nosdeputesData)
	  			resolve(ns.nosdeputesData)
	  		}, function(r){
	  			reject(r)
	  		})
	  	}
	  })
  }

  ns.getCosignData = function(){
  	return new Promise(function(resolve, reject) {
	  	if (ns.cosignData) {
	  		resolve(ns.cosignData)
	  	} else {
	  		$http.get('data/cosign.json').then(function(r){
	  			ns.cosignData = r.data
	  			ns.indexes = dataCruncher.consolidateSourceData(r.data)
	  			resolve(r.data)
	  		}, function(r){
	  			reject(r)
	  		})
	  	}
	  })
  }

  ns.getIndexes = function(){
  	return ns.indexes
  }

  return ns
})

.factory('dataCruncher', function(){
  var ns = {}     // namespace

  ns.consolidateNosDeputesData = function(data) {
  	data.deputes = {}
  	d3.keys(data.deputesData).forEach(function(legislature){
  		data.deputesData[legislature].deputes.forEach(function(depute){
  			data.deputes[depute.depute.id] = depute.depute
  		})
  	})

  	data.groupes = {}
  	data.groupes_byAcro = {}
  	d3.keys(data.groupesData).forEach(function(legislature){
  		data.groupesData[legislature].organismes.forEach(function(org){
  			data.groupes[org.organisme.id] = org.organisme
  			data.groupes_byAcro[org.organisme.acronyme] = org.organisme
  		})
  	})

  	data.projets = {}
  	data.projetsData.forEach(function(d){
  		d.dossiers.forEach(function(projet){
  			data.projets[projet.assemblee_slug] = projet
  		})
  	})
  }

  ns.consolidateSourceData = function(data) {
  	var indexes = {projets:{}}

  	// Iterate over:
  	// Projet de loi
  	var projet_id
    for (projet_id in data) {
      var projet = data[projet_id]
      indexes.projets[projet_id] = {lectures:{}, articles:{}}

      // Iterate over:
      // Projet de loi > Lecture (texte)
      var lecture_id
      for (lecture_id in projet) {
        var lecture = projet[lecture_id]
	      indexes.projets[projet_id].lectures[lecture_id] = {articles:{}}

        // Iterate over:
        // Projet de loi > Lecture (texte) > Article
        var article_id
        for (article_id in lecture) {
          var article = lecture[article_id]
		      indexes.projets[projet_id].articles[article_id] = {}
          
          // Ignore article if...
          // ...it has no signatures d'amendements
          var amendement_signatures_count = d3.sum(article.sign_amend.map(function(d){ return d.length }))
          // ...it has no groups (all amendements signed by 0-1 person)
          var groups_count = d3.keys(article.groups).length
          if (amendement_signatures_count == 0 || groups_count == 0) {
          	article.ignore = true
          } else {
	          // Compute the indexes of the article
	          ns.consolidateArticle(article)
          }
        }

        // Aggregate indexes to the LECTURE level
        var lectureIndex = indexes.projets[projet_id].lectures[lecture_id]
        lectureIndex.alignement_total = d3.sum(d3.keys(lecture), function(d){
        	return lecture[d].alignement_total
        })
        lectureIndex.amendements = d3.sum(d3.keys(lecture), function(d){
        	return lecture[d].amendements
        })
        lectureIndex.alignement = lectureIndex.alignement_total / lectureIndex.amendements
        lectureIndex.fragmentation = {}
        d3.keys(lecture).forEach(function(d){ // get the keys
        	d3.keys(lecture[d].fragmentation).forEach(function(k){
        		lectureIndex.fragmentation[k] = true
        	})
        })
        d3.keys(lectureIndex.fragmentation).forEach(function(k){ // get the averages by key
        	lectureIndex.fragmentation[k] = d3.mean(d3.keys(lecture), function(d){
        		return !lecture[d].ignore && lecture[d].fragmentation[k]
        	})
        })

      }

      var projetIndex = indexes.projets[projet_id]
      
      // Aggregate indexes to the PROJET level
      projetIndex.alignement_total = d3.sum(d3.keys(projet), function(d){
      	return projetIndex.lectures[d].alignement_total
      })
      projetIndex.amendements = d3.sum(d3.keys(projet), function(d){
      	return projetIndex.lectures[d].amendements
      })
      projetIndex.alignement = projetIndex.alignement_total / projetIndex.amendements
      projetIndex.fragmentation = {}
      d3.keys(projet).forEach(function(d){ // get the keys
      	d3.keys(projetIndex.lectures[d].fragmentation).forEach(function(k){
      		projetIndex.fragmentation[k] = true
      	})
      })
      d3.keys(projetIndex.fragmentation).forEach(function(k){ // get the averages by key
      	projetIndex.fragmentation[k] = d3.mean(d3.keys(projet), function(d){
      		return projetIndex.lectures[d].fragmentation[k]
      	})
      })
      projetIndex.fragmentation_moyenne = d3.mean(d3.keys(projetIndex.fragmentation), function(d){ return projetIndex.fragmentation[d]})
      projetIndex.fragmentation_max = d3.max(d3.keys(projetIndex.fragmentation), function(d){ return projetIndex.fragmentation[d]})


      // Aggregate indexes to the ARTICLE level
      d3.keys(projetIndex.articles).forEach(function(article_id){ // get the indexes by key
      	var articleIndex = projetIndex.articles[article_id]
	      articleIndex.alignement_total = d3.sum(d3.keys(projet), function(lecture_id){
	      	var article = projet[lecture_id][article_id]
	      	return article && article.alignement_total
	      })
	      articleIndex.amendements = d3.sum(d3.keys(projet), function(lecture_id){
	      	var article = projet[lecture_id][article_id]
	      	return article && article.amendements
	      })
	      articleIndex.alignement = articleIndex.alignement_total / articleIndex.amendements

	      articleIndex.fragmentation = {}
	      d3.keys(projet).forEach(function(lecture_id){ // get the keys
	      	d3.keys(projetIndex.lectures[lecture_id].fragmentation).forEach(function(k){
	      		articleIndex.fragmentation[k] = true
	      	})
	      })
	      d3.keys(articleIndex.fragmentation).forEach(function(k){ // get the averages by key
	      	articleIndex.fragmentation[k] = d3.mean(d3.keys(projet), function(lecture_id){
	      		var article = projet[lecture_id][article_id]
	      		return article && !article.ignore && article.fragmentation[k]
	      	})
	      })
	      var voidKeys = d3.keys(articleIndex.fragmentation).filter(function(k){
	      	return articleIndex.fragmentation[k] === undefined
	      })
	      voidKeys.forEach(function(k){
	      	delete articleIndex.fragmentation[k]
	      })
      })

    }

    return indexes
  }

  // Compute the indexes for an article (of a lecture of a project)
  ns.consolidateArticle = function(d) {
  	// d.groups -be-like-> LR: {nc:630, np:36}
   	// d.inter_cosign -be-like-> 123
    // d.sign_amend -be-like-> List of lists of {id: 200, groupe: "LR"}
  	
    var groups_fragmentation = {}
    var group_id
    for (group_id in d.groups) {
      var g = d.groups[group_id]
      var group_density = g.nc / (g.np * (g.np - 1))
      groups_fragmentation[group_id] = Math.max(0, 1 - group_density)
    }
    // d.amendements = d.sign_amend.filter(function(d){ return d.length > 1 }).length // amendements signed by at least 2
    d.amendements = d.sign_amend.length
    d.alignement_total = Math.sqrt(d.inter_cosign)
    d.alignement = d.alignement_total / d.amendements
    d.fragmentation = groups_fragmentation
  }

  return ns
})

// Directives
.directive('alignFragListItem', function(){
  return {
    restrict: 'E',
    templateUrl: 'components/alignFragListItem.html',
    scope: {
      item: '=',
      groups: '=',
      showDate: '='
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
					x.domain([0, 10])
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
				      		return Math.min(x($scope.alignement), width) - 3 
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
      fragmentation: '=',
      groups: '='
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

	        // Sort
	        data.sort(function(a, b){
	        	return $scope.groups[a.label].order - $scope.groups[b.label].order
	        })

	        var settings = {}
	        settings.column_spacing = 6
	        settings.bar_thickness = 2
	        settings.label_y_offset = -12
	        settings.label_font_family = 'Quicksand, sans-serif'
          settings.label_font_weight = '400'
          settings.label_font_size = '14px'

          // set the dimensions and margins of the graph
					var margin = {top: 18, right: 6, bottom: 18, left: 6},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;
					// set the ranges
					var y = d3.scaleLinear()
					          .range([0, height - 3.5*settings.bar_thickness])

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
					      .attr('y', function(d) {
					      	var modY = y(d.count) + 3.5*settings.bar_thickness // No bars overlap for frag. 0
					      	return (height - modY)/2 + b * modY - settings.bar_thickness / 2 
					      })
					      .attr('height', function(d) { return settings.bar_thickness })
					      .attr('fill', function(d){ return 'rgb(' + $scope.groups[d.label].couleur + ')'})
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
