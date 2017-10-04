angular.module('infles-login', ['infles']);

var globscope

var RegisterController = function($scope, $http) {
	globscope = $scope
	
	$http.get('/api/getEducationLevels').success(updateEdList);

    $scope.register = function(username, password) {
    	    username = document.getElementById('username').value;
    	    password = document.getElementById('password').value;
    	    password2 = document.getElementById('password2').value;
    	    edLevel = document.getElementById('edLevelSelect').value;
    	    
    	    if(password!=password2)
    	    {
    	    	    alert("wachtwoorden komen niet overeen!\n");
    	    	    return;
    	    }
    	    
    	    
        $http.post('/api/addUser', {_id: username, password: password, edLevel:edLevel}).success(function(data, status) {
            if (data.result) {
                window.location = "/dashboard";
            } else {
            	    alert(data.error);
                // error handeling
            }
        });
    };

   
};

function updateEdList(edlist,status)
{
	var edsel = document.getElementById("edLevelSelect")
	var opt = Array();
	
	for(var i=0;edlist[i];i++)
	{
		opt[i] = document.createElement('option');
		opt[i].value = edlist[i];
		opt[i].text = edlist[i];
		edsel.appendChild(opt[i]);
	}
	globscope.update()
}
