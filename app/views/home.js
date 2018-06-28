'use strict';

angular.module('fabfrag.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', function($scope, $timeout, $location, $http) {
  	$scope.loading = true

    $http.get('data/cosign.json')
       .then(function(res){
          console.log(res)
          // Parse
          $scope.items = []
          var projet_id
          for (projet_id in res.data) {
            console.log('PROJET', projet_id)
            var projet = res.data[projet_id]
            $scope.items.push({
              shortName: projet_id,
              date: {
                depot: 'à faire',
                promulgation: 'à faire'
              }
            })
            var lecture_id
            for (lecture_id in projet) {
              var lecture = projet[lecture_id]
              var article_id
              for (article_id in lecture) {
                var d = lecture[article_id]
                var indexes = computeIndexes(d)
                d.groups // LR: {nc:630, np:36}
                d.inter_cosign // 123
                d.sign_amend // List of lists of {id: 200, groupe: "LR"}
              }
            }
          }
          $scope.loading = false
        })

    function computeIndexes(d) {
      // Sum of internal cosignatures
      var sum_of_internal_cosignatures = d3.sum(d3.keys(d.groups), function(group){ return d.groups[group].nc })

      // Sum of internal potential cosignatures
      var sum_of_potential_internal_cosignatures = d3.sum(d3.keys(d.groups), function(group){
        var count = d.groups[group].np
        return count * (count - 1)
      })

      // Sum of parlementaires
      var sum_of_parlementaires = d3.sum(d3.keys(d.groups), function(group){ return d.groups[group].np })
      
      // Cosignatures potential: if every pair of parlementaires consigned once (and only once)
      var cosignatures_potential = sum_of_parlementaires * (sum_of_parlementaires - 1)

      // Sum of cosignatures
      var sum_cosignatures = d.inter_cosign + sum_of_internal_cosignatures

      // Modularity share for internal
      var modularity_share_internal = (1/(4 * sum_cosignatures)) * (sum_of_internal_cosignatures - sum_of_potential_internal_cosignatures * Math.pow(sum_of_parlementaires - 1, 2) / (2 * sum_cosignatures))

      console.log(modularity_share_internal || 0)


    }

})
