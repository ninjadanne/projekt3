var searchApp = angular.module("skate.Search",[]);
  searchApp.controller("empCtrl",function($scope){
    $scope.query = {}
    $scope.queryBy = '$'
    $scope.employees = [
      {
        "name" : "Mahesh Pachangane",
        "company" : "Syntel India Pvt. Ltd",
        "designation" : "Associate"
      },
      {
        "name" : "Brijesh Shah",
        "company" : "Britanica Software Ltd.",
        "designation" : "Software Engineer"
      }
    ];
    $scope.orderProp="name";                
  });
