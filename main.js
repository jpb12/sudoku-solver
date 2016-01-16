angular.module('sudukoSolver', []).controller('sudokoCtrl', ['$scope', '$timeout', function($scope, $timeout){
	// The correct angular way is to do this in a directive
	$(document).on('ready', function resizeOutput() {
		var output = $('.output');
		output.css('max-height', $(window).height() - 590);
	});

	// Dummy Data
	$scope.sudoku = [
		6,0,0,0,0,7,3,0,0,
		0,0,0,0,0,0,0,1,0,
		0,0,7,4,5,2,0,0,0,
		0,0,1,8,0,0,0,0,4,
		0,5,0,0,4,0,0,6,0,
		4,0,0,0,0,1,2,0,0,
		0,0,0,2,3,4,7,0,0,
		0,6,0,0,0,0,0,0,0,
		0,0,4,6,0,0,0,0,5
	];
	
	$scope.answers = [];
	$scope.invalidAnswers = [];
	$scope.possibleAnswers = [];
	$scope.output = '';
	$scope.solveMode = true;

	for (var i = 0; i < $scope.sudoku.length; i++) {
		if ($scope.sudoku[i] === 0){
			$scope.answers.push('');
			$scope.possibleAnswers.push(['1','2','3','4','5','6','7','8','9']);
		} else {
			$scope.answers.push($scope.sudoku[i].toString());
			$scope.possibleAnswers.push([]);
		}
	}

	$scope.isEdgeDown = function($index){
		return Math.floor($index / 9) === 2 || Math.floor($index / 9) === 5;
	};
	
	$scope.onKeyDown = function($event, $index) {
		var keyCode = $event.keyCode;
		
		// Number key
		if (keyCode >= 48 && keyCode <= 57) {
			$scope.answers[$index] = (keyCode - 48).toString();
			$scope.validateInput();
		}
		
		// Numpad key
		else if (keyCode >= 96 && keyCode <= 105) {
			$scope.answers[$index] = (keyCode - 96).toString();
			$scope.validateInput();
		}
		
		// Backspace / Delete
		else if (keyCode === 8 || keyCode === 46) {
			$scope.answers[$index] = '';
			$scope.validateInput();
		}

		// Left key
		else if (keyCode === 37) {
			changeFocus($index, function(index) {
				return index - 1;
			});
		}		
		
		// Up key
		else if (keyCode === 38) {
			changeFocus($index, function(index) {
				return index - 9;
			});
		}		
		
		// Right key
		else if (keyCode === 39) {
			changeFocus($index, function(index) {
				return index + 1;
			});
		}
		
		// Down key
		else if (keyCode === 40) {
			changeFocus($index, function(index) {
				return index + 9;
			});
		}
	};
	
	function changeFocus(startingIndex, nextIndexCallback) {
		var index = nextIndexCallback(startingIndex);
		while (index <= 81 && index >= 0) {
			if ($('#input' + index).length === 1) {
				$timeout(function(){
					$('#input' + index).focus();
				}, 0);
				return;
			}
			index = nextIndexCallback(index);
		}
	}
	
	// Validation
	
	$scope.validateInput = function(){
		$scope.invalidAnswers = [];
		removeInvalidValues();
		validateRows();
		validateColumns();
		validateSquares();
	};
	
	function removeInvalidValues(){
		for (var i = 0; i < $scope.answers.length; i++){
			switch ($scope.answers[i]) {
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					continue;
				default:
					$scope.answers[i] = '';
			}
		}
	};
	
	function validateRows(){
		validate(function(i, j){
			return  i * 9 + j;
		});
	}
	
	function validateColumns(){
		validate(function(i, j){
			return  i + j * 9;
		});
	}
	
	function validateSquares(){
		validate(function(i, j){
			return i * 3 + (Math.floor(i / 3) * 18) + (Math.floor(j / 3) * 9) + j % 3;
		});
	}
	
	function validate(indexCallback){
		for (var i = 0; i < 9; i++){
			var values = [];
			for (var j = 0; j < 9; j++){
				var index =  indexCallback(i, j);
				var answer = $scope.answers[index];
				var answerIndex = values.indexOf(answer);
				if (answer && answerIndex !== -1){
					$scope.invalidAnswers.push(indexCallback(i, answerIndex));
					$scope.invalidAnswers.push(index);
				}
				values.push(answer);
			}
		}
	}
	
	$scope.isSudokuComplete = function(){
		if ($scope.invalidAnswers.length > 0) {
			return false;
		}
		for (var i = 0; i < $scope.answers.length; i++) {
			if ($scope.answers[i] === '') {
				return false;
			}
		}
		return true;
	};
	
	// Solving
	
	$scope.solveNextStep = function() {
		removeSelectedAnswers();
		checkForContradiction();
		if ($scope.invalidAnswers.length > 0) {
			window.alert('Sudoku puzzle has no solution');
		} else if (
			removePossibilities() ||
			fillInOnlyPossibleAnswer() ||
			fillInOnlyPossibleAnswerInRow() ||
			fillInOnlyPossibleAnswerInColumn() ||
			fillInOnlyPossibleAnswerInSquare() ||
			removeSquareRowPossibilities() ||
			removeSquareColumnPossibilities() ||
			findTwoMatchingBoxesInRow() ||
			findTwoMatchingBoxesInColumn() ||
			findTwoMatchingBoxesInSquare()) {
			$scope.validateInput();
			window.setTimeout(function() {
				var output = $('.output');
				output.scrollTop(output.prop("scrollHeight"));
			}, 0);
		} else {
			window.alert('Unable to solve sudoku puzzle');
		}
	};
	
	// Check for any unanswered boxes with no possible answers
	function checkForContradiction() {
		for (var i = 0; i < $scope.answers.length; i++){
			if ($scope.answers[i] === '' && $scope.possibleAnswers[i].length === 0) {
				$scope.invalidAnswers.push(i);
			}
		}
	}
	
	function removeSelectedAnswers(){
		for (var i = 0; i < $scope.answers.length; i++){
			if ($scope.answers[i] !== '') {
				$scope.possibleAnswers[i] = [];
			}
		}
	}
	
	// Only one possible answer for that box
	function fillInOnlyPossibleAnswer(){
		for (var i = 0; i < $scope.answers.length; i++){
			if ($scope.answers[i] === '' && $scope.possibleAnswers[i].length === 1) {
				$scope.answers[i] = $scope.possibleAnswers[i][0];
				$scope.output += 'Setting (' + (i % 3 + 1) + ', ' + (Math.floor(i / 3) + 1) + ') to ' + $scope.answers[i] + ' as no other number is possible\n';
				return true;
			}
		}
		return false;
	}
	
	// Only one box in that row can have that answer	
	function fillInOnlyPossibleAnswerInRow(){
		return fillInOnlyPossibleAnswerBasic(
			function(i, j) { return i * 9 + j; },
			function(i, j, index) {
				return 'Setting (' + (j + 1) + ', ' + (i + 1) + ') to ' + $scope.answers[index] + ' as that answer is not possible elsewhere in that row\n';
			});
	}
	
	// Only one box in that column can have that answer
	function fillInOnlyPossibleAnswerInColumn(){
		return fillInOnlyPossibleAnswerBasic(
			function(i, j) { return i + j * 9; },
			function(i, j, index) {
				return 'Setting (' + (i + 1) + ', ' + (j + 1) + ') to ' + $scope.answers[index] + ' as that answer is not possible elsewhere in that column\n';
			});
	}
	
	// Only one box in that square can have that answer
	function fillInOnlyPossibleAnswerInSquare(){
		return fillInOnlyPossibleAnswerBasic(
			function(i, j) { return i * 3 + (Math.floor(i / 3) * 18) + (Math.floor(j / 3) * 9) + j % 3; },
			function(i, j, index) {
				var row = Math.floor(i / 3) * 3 + Math.floor(j / 3) + 1;
				var column = i % 3 * 3 + j % 3 + 1;
				return 'Setting (' + row + ', ' + column + ') to ' + $scope.answers[index] + ' as that answer is not possible elsewhere in that square\n';
			});
	}
	
	function fillInOnlyPossibleAnswerBasic(indexCallback, messageCallback){
		for (var i = 0; i < 9; i++) {
			var values = [[],[],[],[],[],[],[],[],[]];
			for (var j = 0; j < 9; j++) {
				var index = indexCallback(i, j);
				for (var k = 0; k < $scope.possibleAnswers[index].length; k++) {
					values[$scope.possibleAnswers[index][k] - 1].push(j);
				}
			}
			for (var j = 0; j < 9; j++) {
				if (values[j].length === 1) {
					var index = indexCallback(i, values[j][0]);
					$scope.answers[index] = (j + 1).toString();
					$scope.output += messageCallback(i, values[j][0], index);
					return true;
				}
			}
		}
		return false;
	}
	
	function removePossibilities() {
		var result = removeRowPossibilities();
		result = removeColumnPossibilities() || result;
		result = removeSquarePossibilities() || result;
		if (result) {
			$scope.output += 'Filtering possible numbers by entered values\n';
		}
		return result;
	}
	
	// A number can appear only once in a row
	function removeRowPossibilities(){
		return removePossibilitiesBasic(function(i, j) { return i * 9 + j; });
	}
	
	// A number can appear only once in a column
	function removeColumnPossibilities(){
		return removePossibilitiesBasic(function(i, j) { return i + j * 9; });
	}
	
	// A number can appear only once in a square
	function removeSquarePossibilities(){
		return removePossibilitiesBasic(function(i, j) { return  i * 3 + (Math.floor(i / 3) * 18) + (Math.floor(j / 3) * 9) + j % 3; });	
	}
	
	function removePossibilitiesBasic(indexCallback){
		var changesMade = false;
		for (var i = 0; i < 9; i++) {
			var values = [];
			for (var j = 0; j < 9; j++) {
				var index = indexCallback(i, j);
				if ($scope.answers[index] !== '') {
					values.push($scope.answers[index]);
				}
			}
			for (var j = 0; j < 9; j++) {
				var index = indexCallback(i, j);
				for (var k = 0; k < values.length; k++) {
					var indexOfAnswer = $scope.possibleAnswers[index].indexOf(values[k]);
					if (indexOfAnswer !== -1) {
						$scope.possibleAnswers[index].splice(indexOfAnswer, 1);
						changesMade = true;
					}
				}
			}
		}
		return changesMade;
	}
	
	// If a number can only appear within one row of a square, then it is not possible in that row in another square
	function removeSquareRowPossibilities(){
		// Repeat for each square
		for (var i = 0; i < 9; i++) {
			// Build a list of possible values for each row
			var values = [[], [], []];
			for (var j = 0; j < 9; j++) {
				var index = i * 3 + (Math.floor(i / 3) * 18) + (Math.floor(j / 3) * 9) + j % 3;
				values[Math.floor(j / 3)] = values[Math.floor(j / 3)].concat($scope.possibleAnswers[index]);
			}
			// Loop through each possible answer
			for (var k = 0; k < 9; k++) {
				var kStr = (k + 1).toString();
				var row = -1;
				// Check if it is only possible in one row
				if (values[0].indexOf(kStr) !== -1 && values[1].indexOf(kStr) === -1 && values[2].indexOf(kStr) === -1) {
					row = Math.floor(i / 3) * 3;
				} else if (values[0].indexOf(kStr) === -1 && values[1].indexOf(kStr) !== -1 && values[2].indexOf(kStr) === -1) {
					row = Math.floor(i / 3) * 3 + 1;
				} else if (values[0].indexOf(kStr) === -1 && values[1].indexOf(kStr) === -1 && values[2].indexOf(kStr) !== -1) {
					row = Math.floor(i / 3) * 3 + 2;
				}
				if (row !== -1) {
					var changesMade = false;
					for (var l = 0; l < 9; l++) {
						// Skip the part of that row in the original square
						if (i % 3 === Math.floor(l / 3)) {
							continue;
						}
						var index = row * 9 + l;
						var indexOfAnswer = $scope.possibleAnswers[index].indexOf(kStr);
						if (indexOfAnswer !== -1) {
							changesMade = true;
							$scope.possibleAnswers[index].splice(indexOfAnswer, 1);
						}
					}
					if (changesMade) {
						var squareString = i % 3 === 0 ? 'first' : i % 3 === 1 ? 'middle' : 'end';
						$scope.output += 'Removing ' + kStr + ' from other squares in row ' + (row + 1) + ' as it must be in the ' + squareString + ' square\n';
						return true;
					}
				}
			}
		}
		return false;
	}
	
	// If a number can only appear within one column of a square, then it is not possible in that column in another square
	function removeSquareColumnPossibilities(){
		for (var i = 0; i < 9; i++) {
			var values = [[], [], []];
			for (var j = 0; j < 9; j++) {
				var index = i * 3 + (Math.floor(i / 3) * 18) + (Math.floor(j / 3) * 9) + j % 3;
				values[j % 3] = values[j % 3].concat($scope.possibleAnswers[index]);
			}
			for (var k = 0; k < 9; k++) {
				var kStr = (k + 1).toString();
				var column = -1;
				if (values[0].indexOf(kStr) !== -1 && values[1].indexOf(kStr) === -1 && values[2].indexOf(kStr) === -1) {
					column = (i % 3) * 3;
				} else if (values[0].indexOf(kStr) === -1 && values[1].indexOf(kStr) !== -1 && values[2].indexOf(kStr) === -1) {
					column = (i % 3) * 3 + 1;
				} else if (values[0].indexOf(kStr) === -1 && values[1].indexOf(kStr) === -1 && values[2].indexOf(kStr) !== -1) {
					column = (i % 3) * 3 + 2;
				}
				if (column !== -1) {
					var changesMade = false;
					for (var l = 0; l < 9; l++) {
						if (Math.floor(i / 3) === Math.floor(l / 3)) {
							continue;
						}
						var index = column + l * 9;
						var indexOfAnswer = $scope.possibleAnswers[index].indexOf(kStr);
						if (indexOfAnswer !== -1) {
							changesMade = true;
							$scope.possibleAnswers[index].splice(indexOfAnswer, 1);
						}
					}
					if (changesMade) {
						var squareString = Math.floor(i / 3) === 0 ? 'first' : Math.floor(i / 3) === 1 ? 'middle' : 'end';
						$scope.output += 'Removing ' + kStr + ' from other squares in column ' + (column + 1) + ' as it must be in the ' + squareString + ' square\n';
						return true;
					}
				}
			}
		}
		return false;
	}
	
	// If two boxes in a row have the same two possible answers, and no others, then these can be removed from other boxes in that row
	function findTwoMatchingBoxesInRow(){
		return findTwoMatchingBoxesBasic(
			function(i, j) { return i * 9 + j; },
			function(i, j, k, index) {
				return 'Removing ' + $scope.possibleAnswers[index][0] + ' and ' + $scope.possibleAnswers[index][1] + ' from row ' +
					(i + 1) + ' as they must be in columns ' + (j + 1) + ' and ' + (k + 1) + '\n';
			});
	}
	
	// If two boxes in a row have the same two possible answers, and no others, then these can be removed from other boxes in that row
	function findTwoMatchingBoxesInColumn(){
		return findTwoMatchingBoxesBasic(
			function(i, j) { return i + j * 9; },
			function(i, j, k, index) {
				return 'Removing ' + $scope.possibleAnswers[index][0] + ' and ' + $scope.possibleAnswers[index][1] + ' from column ' +
					(i + 1) + ' as they must be in rows ' + (j + 1) + ' and ' + (k + 1) + '\n';
			});
	}
	
	// If two boxes in a row have the same two possible answers, and no others, then these can be removed from other boxes in that row
	function findTwoMatchingBoxesInSquare(){
		return findTwoMatchingBoxesBasic(
			function(i, j) { return  i * 3 + (Math.floor(i / 3) * 18) + (Math.floor(j / 3) * 9) + j % 3; },
			function(i, j, k, index) {
				var firstColumn = Math.floor(i / 3) * 3 + Math.floor(j / 3) + 1;
				var firstRow = i % 3 * 3 + j % 3 + 1;
				var secondColumn = Math.floor(i / 3) * 3 + Math.floor(k / 3) + 1;
				var secondRow = i % 3 * 3 + k % 3 + 1;
				var squareStringX = i % 3 === 0 ? 'left' : i % 3 === 1 ? 'middle' : 'right';
				var squareStringY = Math.floor(i / 3) === 0 ? 'top' : Math.floor(i / 3) === 1 ? 'middle' : 'bottom';
				return 'Removing ' + $scope.possibleAnswers[index][0] + ' and ' + $scope.possibleAnswers[index][1] + ' from ' +
					squareStringY + ' ' + squareStringX + ' square because they must be in boxes (' + firstRow + ', ' + firstColumn +
					') and (' + secondRow + ', ' + secondColumn + ')\n';
			});
	}
	
	function findTwoMatchingBoxesBasic(indexCallback, messageCallback){
		for (var  i = 0; i < 9; i++) {
			for (var j = 0; j < 8; j++) {
				var index = indexCallback(i, j);
				if ($scope.possibleAnswers[index].length !== 2) {
					continue;
				}
				for (var k = j + 1; k < 9; k++) {
					var kIndex = indexCallback(i, k);
					if ($scope.possibleAnswers[index].toString() === $scope.possibleAnswers[kIndex].toString()) {
						var changesMade = false;
						for (var l = 0; l < 9; l++) {
							if (l === j || l === k) {
								continue;
							}
							var lIndex = indexCallback(i, l);
							var firstAnswerIndex = $scope.possibleAnswers[lIndex].indexOf($scope.possibleAnswers[index][0]);
							if (firstAnswerIndex !== -1) {
								changesMade = true;
								$scope.possibleAnswers[lIndex].splice(firstAnswerIndex, 1);
							}
							var secondAnswerIndex = $scope.possibleAnswers[lIndex].indexOf($scope.possibleAnswers[index][1]);
							if (secondAnswerIndex !== -1) {
								changesMade = true;
								$scope.possibleAnswers[lIndex].splice(secondAnswerIndex, 1);
							}
						}
						if (changesMade) {
							$scope.output += messageCallback(i, j, k, index);
							return true;
						}
					}
				}
			}
		}
		return false;
	}
}]);