'use strict';

angular.module('fabfrag.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', function($scope, $timeout, $location, dataStore) {
  	$scope.loading = true

    dataStore.getCosignData().then(function(data){
      $timeout(function(){
        console.log(data)

        // Parse
        $scope.items = []
        var projet_id
        for (projet_id in data) {
          var projet = data[projet_id]

          var projet_alignement_sum = 0
          var projet_fragmentation_sum = {}
          var projet_count = 0
          var k

          var lecture_id
          for (lecture_id in projet) {
            var lecture = projet[lecture_id]
            var lecture_alignement_sum = 0
            var lecture_fragmentation_sum = {}
            var lecture_count = 0
            var article_id
            for (article_id in lecture) {
              var d = lecture[article_id]
              var indexes = computeIndexes(d)
              d.groups // LR: {nc:630, np:36}
              d.inter_cosign // 123
              d.sign_amend // List of lists of {id: 200, groupe: "LR"}
              if (!isNaN(indexes.alignement)) {
                lecture_alignement_sum += indexes.alignement
                for (k in indexes.fragmentation) {
                  if (lecture_fragmentation_sum[k] === undefined) {
                    lecture_fragmentation_sum[k] = 0
                  }
                  lecture_fragmentation_sum[k] += indexes.fragmentation[k]
                }

                lecture_count++
              }
            }
            projet_alignement_sum += lecture_alignement_sum
            for (k in lecture_fragmentation_sum) {
              if (projet_fragmentation_sum[k] === undefined) {
                projet_fragmentation_sum[k] = 0
              }
              projet_fragmentation_sum[k] += lecture_fragmentation_sum[k]
            }
            projet_count += lecture_count
          }

          var projet_alignement_mean = projet_alignement_sum / projet_count
          var projet_fragmentation_mean = {}
          for (k in projet_fragmentation_sum) {
            projet_fragmentation_mean[k] = projet_fragmentation_sum[k] / projet_count
          }


          $scope.items.push({
            id: projet_id,
            shortName: projet_id,
            date: {
              depot: 'à faire',
              promulgation: 'à faire'
            },
            alignement: projet_alignement_mean || 0,
            fragmentation: projet_fragmentation_mean
          })

        }
        $scope.loading = false
      })
    })

})
