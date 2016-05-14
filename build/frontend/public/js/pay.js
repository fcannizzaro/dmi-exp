var app = angular.module("dmi-exp", []);

app.controller("ctrl", function($scope, $http) {

    $scope.body = {
        me: true,
        emails: []
    };

    $scope.up = function() {
        var count = 0;
        var emails = $scope.body.emails;
        for (var i = 0; i < emails.length; i++)
            if (emails[i]) count++;
        return count;
    }

    $scope.loading = false;
    $scope.quote = 0;

    $http.get("/week", $scope.body, {}).then(function(res) {
        $scope.quote = res.data.week;
    });

    $scope.pay = function() {

        $scope.loading = true;

        $http.post("/pay", $scope.body, {}).then(function(res) {
            if (res.data.success)
                window.location = res.data.redirect;
        });

    }

});