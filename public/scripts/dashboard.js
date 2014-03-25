angular.module('infles-dashboard', ['infles']);
 
function DashboardCtrl($scope, $location, $modal) {

	$scope.exercises = [
		{
			"_id": "A1",
			"performers": ["user_110259", "class_V5A"],
			"name": "Paragraaf 1.1",
			"startDate": "31/12/2013 23:58",
			"endData": "31/12/2013 23:59",
			"boordeling": "HD"
		},
		{
			"_id": "A2",
			"performers": ["user_110259", "class_V5A"],
			"name": "Paragraaf 1.2",
			"startDate": "31/12/2013 23:58",
			"endData": "31/12/2013 23:59",
			"boordeling": "HD"
		},
		{
			"_id": "A3",
			"performers": ["user_110259", "class_V5A"],
			"name": "Paragraaf 1.3",
			"startDate": "31/12/2013 23:58",
			"endData": "31/12/2013 23:59",
			"boordeling": "HD"
		}
	];

	$scope.openDialog = function(template, scope) {
		$modal.open({
			templateUrl: template,
			scope: scope
		});
 };
};