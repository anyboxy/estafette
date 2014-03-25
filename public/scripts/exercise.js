
var infex = angular.module('infles-exercise', ['infles', 'videosharing-embed']);

infex.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}]);

function ExerciseCtrl($scope, $location, $modal, $http) {

	$scope.answers = {};

	var url = $location.absUrl();
	$scope.exercise = url.substring(url.lastIndexOf("/") + 1);

	$http.get("/api/answers/" + $scope.exercise)
		.success(function(data, status, headers, config) {
			for (var i = 0; i < data.result.length; i++) {
				var answer = data.result[i];
				$scope.answers[answer.field] = answer.answer;
			}
		  })
		.error(function(data, status, headers, config) {
		  });

	$scope.save = function() {
		var data = [];
		for (var field in $scope.answers) {
			data.push({
				user: $scope.user._id, 
				exercise: $scope.exercise, 
				field: field, 
				answer: $scope.answers[field]
			});
		}
		$http.post("/api/answers/" + $scope.exercise, data)
			.success(function(data) {
				if (data.result === true) {
					window.location = "/dashboard";
				}
			})
			.error(function(data) {
			});
	};

	$scope.openDialog = function(template, scope) {
		$modal.open({
			templateUrl: template,
			scope: scope
		});
 };
};