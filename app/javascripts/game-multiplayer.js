var socket = io();

function wrapLettersWithSpans(text){
	var newText = '';

	for (var i = 0; i < text.length; i++){
		newText += '<span>' + text.charAt(i) + '</span>';
	}

	return newText;
}

$(document).ready(function() {

	// регистрация событий на клиенте

	// выбор режима "случайный пользователь"
	$('.game-modes__random-game').click(function(event) {
		event.preventDefault();

		$('.game-modes').addClass('fadeOut');
		setTimeout(function(){
			// прячем выборы режима
			$('.game-modes').addClass('unvisible').removeClass('fadeOut'); // удаляем ненужные классы

			// появление блока ожидания игрока
			$('.game-area__players-av').removeClass('unvisible').addClass('fadeIn');

			// сообщение серверу
			socket.emit('game random start');
		}, 500);	
	});

	$('.game-modes__pair-game').click(function(event){
		event.preventDefault();

		$('.game-modes').addClass('fadeOut');
		setTimeout(function(){
			// прячем выборы режима
			$('.game-modes').addClass('unvisible').removeClass('fadeOut');

			// появление блока создания или присоединения к комнате
			$('.pair-game-modes').removeClass('unvisible').addClass('fadeIn');
		}, 500);
	});

	$('.pair-game-modes__create').click(function(event) {
		event.preventDefault();

		$('.pair-game-modes').removeClass('fadeIn');
		$('.pair-game-modes__join-mode, .pair-game-modes__create').addClass('fadeOut');
		
		socket.emit('game pair start');
	});

	$('.pair-game-modes__join-roomCode_enter').click(function(event) {
		event.preventDefault();
		
		socket.emit('game pair join', $('.pair-game-modes__join-roomCode').val());
		$('.pair-game-modes__join-roomCode').val('');
	});

	socket.on("room created result", function(roomName, isPairGame) {
		if (isPairGame){ // игра по коду	
			$('.pair-game-modes').removeClass('fadeIn').addClass('fadeOut');
			setTimeout(function(){
				$('.pair-game-modes').addClass('unvisible').removeClass('fadeOut');
				
				// показываем зону для игры
				$('.game-area').removeClass('unvisible').addClass('fadeIn');
			}, 500);
		} else{ // рандомные юзеры
			$('.game-area__players-av').removeClass('fadeIn').addClass('fadeOut');
			setTimeout(function(){
				$('.game-area__players-av').addClass('unvisible').removeClass('fadeOut');
				
				// показываем зону для игры
				$('.game-area').removeClass('unvisible').addClass('fadeIn');
			}, 500);
		}
		
	});

	socket.on('show room code', function(name) {
		$('.pair-game-modes__create_roomCode').text('show this code to other players: ' + name);

		setTimeout(function(){
			$('.pair-game-modes__join-mode, .pair-game-modes__create').addClass('unvisible').removeClass('fadeOut');
			
			$('.pair-game-modes__create_roomCode').removeClass('unvisible').addClass('fadeIn');
		}, 500);
	});

////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var rightSentence = '', keyPressed = 1;

	$('.game-area__user-sentence').bind("cut copy paste", function(e) {
      	e.preventDefault();
 	});
 	$('.game-area__user-sentence').bind("contextmenu",function(e){ 
 		e.preventDefault(); 
 	});

	socket.on("show new sentence result", function(text) {
		$('.game-area__user-sentence').val('');
		
		rightSentence = text;
		socket.emit('allow to enter sentence');

		var newText = wrapLettersWithSpans(text);

		$('.game-area__sentence').removeClass('fadeInLeft');
		$('.game-area__sentence').addClass('fadeOutRight');
		setTimeout(function(){
			$('.game-area__sentence').removeClass('fadeOutRight');

			$('.game-area__sentence').html(newText);
			$('.game-area__sentence').addClass('fadeInLeft');
		}, 500)
		
	});

	$('.game-area__user-sentence').keydown(function(event) {
		var code = event.keyCode || event.which;

		keyPressed++;
		if (code == 8){
			keyPressed--;
		}
		else return true;
	});

	$('.game-area__user-sentence').keyup(function(event) {
		event.preventDefault();
		var code = event.keyCode || event.which;
		
		userSentence = $('.game-area__user-sentence').val();

		var pos = -1;
		if ((pos = rightSentence.indexOf(userSentence)) != -1){

			if (userSentence == rightSentence && keyPressed >= rightSentence.length){
				keyPressed = 1;
				socket.emit('show new sentence');
			} else{
				$('.game-area__sentence span').removeClass('color_green');

				var pos_end = pos + userSentence.length;
				var str = '.game-area__sentence span:nth-child(n+' + (pos + 1) + '):nth-child(-n+' + pos_end + ')';
				
				$(str).addClass('color_green');
			}

		} else{
			$('.game-area__sentence').removeClass('fadeInLeft');
			$('.game-area__sentence').addClass('shake');
			setTimeout(function(){
				$('.game-area__sentence').removeClass('shake');
			}, 500);
		}
	});

	socket.on('refresh my points', function(p){
		$('.you .game-area__user-points').text(p);
	});

	socket.on('refresh opponent points', function(p){
		$('.op .game-area__user-points').text(p);
	});

	socket.on('exit room', function(msg) {
		$('.popup-msg__text').html(msg + '<br>This game will be reloaded in 10 seconds.');

		$('.popup-msg-wrap').removeClass('unvisible').addClass('fadeIn');

		setTimeout(function(){
			location.reload();
		}, 10000);
	});

});