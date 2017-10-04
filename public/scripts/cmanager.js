angular.module('infles-login', ['infles']);
var globscope
var CManagerCtrl = function($scope, $http) {
	var edlist = 0;
	var edsel;
	
	globscope = $scope
	 $http.get('/api/getEducationLevels').success(updateEdList);
	
	
	
	$scope.update = function() {
		opt = document.getElementById("edLevelSelect").value
		document.getElementById("edLevel").value = opt;
		$http.post('/api/getChapters',{"name":opt}).success(function(data, status) {
		 		 updateChapters(data);
            	 });
    	 
        };
        
        $scope.update();
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

function updateChapters(data)
{
	cont = document.getElementById("cont");
	
	cont.innerHTML = "";
	
	var br = Array();
	var p = Array();
	
	
	for(var i=0;data[i];i++)
	{
		p[i] = document.createElement("input");
		p[i].type = "submit";
		p[i].value = "bewerk " + data[i];
		p[i].setAttribute("onclick", "document.getElementById(\"name\").value=\""+data[i]+"\"");
		
		br[i] = document.createElement("br");
		
		cont.appendChild(p[i]);
		cont.appendChild(br[i]);
	}
}
