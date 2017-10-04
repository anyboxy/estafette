angular.module('infles-login', ['infles']);

var globscope;

function DbmanCtrl($scope, $location, $modal, $http) {

	globscope = $scope;
	$scope.answers = {};

	var url = $location.absUrl();
	$scope.exercise = url.substring(url.lastIndexOf("/") + 1);

	$http.get("/api/getUserList")
		.success(function(data, status, headers, config) {
				
				var div = document.getElementById("userList");
				var br = Array();
				var p = Array();
				for(var i = 0;data[i];i++)
				{
					p[i] = document.createElement("input");
					p[i].type = "button";
					p[i].value = "verwijder " + data[i]._id;
					
					p[i].setAttribute("onclick", "globscope.remove("+"\""+data[i]._id+"\""+")");
					
					br[i] = document.createElement("br");
					
					div.appendChild(p[i]);
					div.appendChild(br[i]);
				}
		  })
		.error(function(data, status, headers, config) {
		  });
	$scope.remove = function(user)
	{
		$http.post('/api/removeUser', {_id: user}).success(function(data, status) {
		if (data.result) {
                window.location = "/dbmanager";
                } else {
            	    alert(data.error);
                // error handeling
                }
                });
	}
};
