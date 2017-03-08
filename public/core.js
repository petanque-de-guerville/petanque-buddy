var scotchTodo = angular.module('scotchTodo', []);

function mainController($scope, $http) {

    $http.get('/api/equipes')
        .success(function(data) {
            $scope.joueurs = data.Item.joueurs;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
}
