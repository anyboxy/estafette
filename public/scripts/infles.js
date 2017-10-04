var infles = angular.module('infles', ['ui.bootstrap']);

infles.directive('navigation', function() {
    return {
	    restrict: 'E',
	    transclude: false,
	    link: function(scope, element, attrs) {
	    },
	    template:
'			<nav class="navbar navbar-default" role="navigation">' + 
'				<ul class="nav navbar-nav navbar-left">' + 
'					<li><a href="/dashboard"><img src="/images/logo.png"></a></li>' +
'                   <li><a href="http://debijbel.nl" target="blank"><img src="/images/bijbel.jpg" height="82"></a></li>' +
'                   ' +
'				</ul>' +
'				<ul class="nav navbar-nav navbar-right">' +
'					<li><button type="button" class="btn btn-default navbar-btn" ng-click="logout()">Uitloggen</button></li>' +
'				</ul>' + 
'			</nav>',
	    replace: true
    };
});

function UserCtrl($scope, $http) {
	$scope.userCtrlReady = false;
	$http.get("/api/me").success(function (data) {
		$scope.userCtrlReady = true;
		if (data.result) {
			$scope.user = data.result;
			$scope.isAdmin = $scope.user.role == "teacher";
		}
	});

    
    $scope.logout = function() {
    	$http.get('/api/logout').success(function() {
    		window.location = "/login?logout=1";
    	});
        
    };
};