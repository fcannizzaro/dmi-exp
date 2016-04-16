var app = angular.module("dmi-exp", []);

app.controller("ctrl", function($scope, $http) {

    $scope.body = {
        me: true,
        emails: []
    };

    $scope.loading = false;

    $scope.pay = function() {

        $scope.loading = true;

        $http.post("/pay", $scope.body, {}).then(function(res) {
            if (res.data.success)
                window.location = res.data.redirect;
        });

    }

});