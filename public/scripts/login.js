angular.module('infles-login', ['infles']);

var LoginController = function($scope, $http) {


    $scope.login = function(username, password) {
        $http.post('/api/login', {username: $scope.username, password: $scope.password}).success(function(data, status) {
            if (data.result) {
                $scope.user = data.result;
				$scope.isAdmin = $scope.user.role == "teacher";
                window.location = "/dashboard";
            } else {
            		alert("verkeerde gebruikersnaam of wachtwoord!");
  
            }
        });
    };

   
};