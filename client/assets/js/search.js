// Define a new module for our app
var skateSearch = angular.module("skate.Search", []);

// Create the instant search filter

skateSearch.filter('searchFor', function(){

	// All filters must return a function. The first parameter
	// is the data that is to be filtered, and the second is an
	// argument that may be passed with a colon (searchFor:searchString)

	return function(arr, searchString){

		if(!searchString){
			return arr;
		}

		var result = [];

		searchString = searchString.toLowerCase();

		// Using the forEach helper method to loop through the array
		angular.forEach(arr, function(place){

			if(place.title.toLowerCase().indexOf(searchString) !== -1){
				result.push(place);
			}

		});

		return result;
	};

});

