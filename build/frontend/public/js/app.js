var app = angular.module("dmi-exp", ['rzModule']);

app.directive('toggleClass', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                element.toggleClass(attrs.toggleClass);
            });
        }
    };
});

app.controller("ctrl", function($scope, $http, $sce, $interval) {

    $scope.secure = false;
    $scope.visibility = {};
    $scope.bets = {};
    $scope.sliders = {};
    $scope.charts = {};
    $scope.flags = {};
    $scope.counter = {};
    $scope.trust = $sce.trustAsHtml;

    $scope.setSecure = function() {
        $scope.secureBet = true;
    }

    $http.get("/counter").then(function(res) {
        $scope.counter.limit = res.data.limit;
        $scope.counter.valid = res.data.valid;
        $scope.counter();
    });


    $scope.counter = function() {
        $scope.counter.text = $scope.counter.valid ? format(new Date($scope.counter.limit) - new Date()) : "";
    }

    $interval($scope.counter, 60 * 1000);

    $scope.simulation = function(match) {

        var bet = $scope.bets[match],
            p1 = bet[0] / 100,
            p2 = bet[2] / 100,
            s1 = 1 - p1,
            s2 = 1 - p2,
            if1 = 100 * (1 - (Math.pow(s1, 2) + Math.pow(p2, 2)) / 2),
            ifx = 100 * (1 - (Math.pow(p1, 2) + Math.pow(p2, 2)) / 2),
            if2 = 100 * (1 - (Math.pow(p1, 2) + Math.pow(s2, 2)) / 2);

        // 1 0 0 , 0 1 0, 0 0 1
        return {
            "<b>E<sub>1</sub></b>": if1.toFixed(2),
            "<b>E<sub>x</sub></b>": ifx.toFixed(2),
            "<b>E<sub>2</sub></b>": if2.toFixed(2)
        };
    }

    $scope.init = function(match) {
        $scope.flags[match] = false;
        $scope.sliders[match] = {
            minValue: 33,
            maxValue: 66,
            options: {
                step: 5,
                ceil: 100,
                noSwitching: true,
                onChange: function() {
                    $scope.flags[match] = true;
                    $scope.bets[match][0] = $scope.sliders[match].minValue;
                    $scope.bets[match][2] = 100 - $scope.sliders[match].maxValue;
                    $scope.bets[match][1] = 100 - $scope.bets[match][0] - $scope.bets[match][2];
                    $scope.update(match);
                }
            }

        };
        $scope.bets[match] = [33, 33, 33];
        $scope.charts[match] = $scope.drawChart(match);
    }

    $scope.getTeam = function(index) {
        return $scope.currentBet.match ? $scope.currentBet.match.split(":")[index] : "";
    }

    $scope.bet = function() {
        $http.post("/bet", {
            bets: $scope.bets
        }, {}).then(function(res) {
            if (res.data.success)
                location.reload();
            else
                console.log("cannot vote!");
        });
    }

    $scope.update = function(match) {

        var chart = $scope.charts[match];
        var bet = $scope.bets[match];

        chart.segments[2].value = bet[0].toFixed(2);
        chart.segments[0].value = bet[2].toFixed(2);
        chart.segments[1].value = bet[1].toFixed(2);
        chart.update();

    }

    $scope.drawChart = function(id) {

        var data = [{
            value: 33,
            color: "#E91E63",
            highlight: "#E91E63",
            label: "2"
        }, {
            value: 33,
            color: "#3F51B5",
            highlight: "#3F51B5",
            label: "x"
        }, {
            value: 33,
            color: "#009688",
            highlight: "#009688",
            label: "1"
        }, ];

        var ctx = document.getElementById(id).getContext("2d");

        var options = {
            animationSteps: 10,
            animationEasing: 'linear',
            tooltipEvents: [],
            tooltipFontSize: 11,
            tooltipXOffset: -16,
            tooltipTitleFontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            tooltipFillColor: "rgba(0,0,0,0.4)",
            tooltipCaretSize: 0,
            tooltipTemplate: "<%= parseInt(value) %>",
            animateRotate: false,
            showTooltips: true,
            onAnimationComplete: function() {
                this.showTooltip(this.segments, true);
            },
        }

        return new Chart(ctx).Pie(data, options);

    }

    function format(t) {
        var cd = 24 * 60 * 60 * 1000,
            ch = 60 * 60 * 1000,
            d = Math.floor(t / cd),
            h = Math.floor((t - d * cd) / ch),
            m = Math.round((t - d * cd - h * ch) / 60000),
            pad = function(n) {
                return n < 10 ? '0' + n : n;
            };
        if (m === 60) {
            h++;
            m = 0;
        }
        if (h === 24) {
            d++;
            h = 0;
        }
        return [days(d), hours(h), minutes(m)].join(' ');
    }

    function days(d) {
        return d == 0 ? "" : d + " " + (d == 1 ? 'giorno' : 'giorni');
    }

    function minutes(m) {
        return m + " " + (m == 1 ? 'minuto' : 'minuti');
    }

    function hours(h) {
        return h == 0 ? "" : h + " " + (h == 1 ? 'ora' : 'ore');
    }

});