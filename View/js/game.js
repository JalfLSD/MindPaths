// Settings
var serverUrl = "http://societic.ibercivis.es/semantics-backend/";
// Game State
var taskId = 0;
var activeWord = "";
var activeWordId = 0;
var startWord = "";
var startWordId = 0;
var endWord = "";
var endWordId = 0;
var steps = 0;
var pathIndex = 0;
var wordsPath = new Array();
var usedWordsPath = new Array();
var deferredTask;
var wordTimePercent;
var clock;
var wordTime = 0;
var gameTime = 0;
var resetState = false;

// Start a new game round
function startGame(task, deferred) {
    // Get task info
    startWordId = task.info.start;
    startWord = task.info.startWord;
    endWordId = task.info.end;
    endWord = task.info.endWord;
    taskId = task.id;
    deferredTask = deferred;    
    startRound();
}

function startRound() {
    // Reset the bullet progress bar
    resetWordBar();

    // Disable the Reset Button
    toggleResetButton(false);

    // Set the header
    $("#lblActualWord").text(startWord);
    $("#lblEndWord").text(endWord);    
    $("#wordLbl0").text(adjustCase(startWord));
    $("#lblQuestion").html("WHAT IS THE PATH FROM '<strong>" + startWord + "</strong>' TO '<strong>" + endWord + "</strong>' ?");
    
    // Initialize game vars
    activeWord = startWord;
    activeWordId = startWordId;
    wordsPath.length = 0;
    usedWordsPath.length = 0;
    pathIndex = 0;
    steps = 0;
    gameTime = 0;
    wordTime = 0;
        
    // Get the new words
    getRelatedWords();
}

function startOver() {
    if (steps == 0)
        return;

    steps++;
    setWordBarItem(steps, true, adjustCase(startWord));
    $("#wordImg" + steps).attr("src", "http://societic.ibercivis.es/semantics/images/endrow.png");
    
    // Reset all used path
    for (var k = 0; k < pathIndex; k++) {
        usedWordsPath[k] ="";
    }

    wordsPath[pathIndex] = "(RESET)";
    pathIndex++;

    activeWord = startWord;
    activeWordId = startWordId;
    getRelatedWords();
    $("#lblActualWord").text(activeWord);

    // reset clocks
    gameTime = 0;
    wordTime = 0;
	
	// Disable the reset button
    toggleResetButton(false);
    
    if (steps == 25) {
        alert("Your path is too long to be used, but keep playing!");
    }
}

function addWordPath(id,word) {
    steps++;
    wordsPath[pathIndex] = word + "~" + wordTime;
    // Save the used link
    usedWordsPath[pathIndex] = activeWordId + "-" + id;
    pathIndex++;

    if (steps == 25) {
        alert("Your path is too long to be used, but keep playing!");
    }
}

function wordSelected(id, word) {
    if (steps < 25) {
        addWordPath(id,word);
        setWordBarItem(steps, true, adjustCase(word));
    }
    else {
        setWordBarItem(25, true, "...");
    }    

    $("#lblActualWord").text(word);
    activeWordId = id;
    activeWord = word;

	// Activate the reset button
	toggleResetButton(true);
	
    if (id == endWordId) {
        completed();
    } else getRelatedWords();
}

function getRelatedWords() {
    stopTimer();
    wordTime = 0;
    $('#progressWordTime').css('width', "0%");
    
    // Call the service
    var request = new XMLHttpRequest();
    $('#sw-container').empty();
    
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                var json = request.responseText;
                var parts = json.split('~');
                var count = parts[0];

                wordsPath[pathIndex] = activeWord;
                pathIndex++;

                // Build the itens index array
                var itemIndex = new Array();
                for (var i = 0; i < count; i++) {
                    itemIndex[i] = i;
                }
                shuffle(itemIndex);

                for (i = 0; i < count; i++) {
                    var id = parts[(itemIndex[i] * 3) + 1];
                    var word = parts[(itemIndex[i] * 3) + 3];

                    // Check if this link was already choosen
                    var used = false;
                    var link = activeWordId + "-" + id;
                    for (var k = 0; k < pathIndex && !used; k++) {
                        used = usedWordsPath[k] == link;
                    }
                    if (!used) {
                        var func = "javascript:wordSelected(" + id + ",'" + word + "');";
                        $('#sw-container').append('<div onclick="'+func+'"><h4>' + word + '</h4></div>');
                    }
                }
                // Setup the words graph        
                setupGraph();
                
                // start the game time
                startTimer();
            } else {
                alert("error: " + request.status);
            }
        }
    };
    request.open('GET', serverUrl + 'links/' + activeWordId, true);
    request.send();
}

function startTimer() {
    clock = setInterval(function () { onTimer(); }, 1000);
}

function onTimer() {
    wordTime++;
    gameTime++;

    var wordProgress = (10 * wordTime) / 6;
    $('#progressWordTime').css('width', wordProgress + "%");
    
    var gameProgress = gameTime / 18;
    $('#progressGameTime').css('width', gameProgress + "%");
    
    if (wordTime == 60 || gameTime == 180) {
        stopTimer();
        WordTimeOut();
    }
}

function stopTimer() {
    window.clearInterval(clock);
}

function WordTimeOut() {
    $('#timeoutDialog').modal('show');
}


function setupGraph() {
    $(function () {
        $('#sw-container').swatchWords({
            // index of centered item
            center: 2,
            // number of degrees that is between each item
            angleInc: -12,
            speed: 700,
            easing: 'ease',
            // amount in degrees for the opened item's next sibling
            proximity: -22,
            // amount in degrees between the opened item's next siblings
            neighbor: -12,
            // animate on load
            onLoadAnim: true,
        });
    });
}

function newWords() {
    //location.reload(true);
    window.location = "http://pybossa.socientize.eu/pybossa/app/Semantics/newtask";
}

function resetWordBar() {
    for (var i = 1; i < 26; i++) {
        setWordBarItem(i, false,"-");
    }
}

function setWordBarItem(index, checked, word) {
    var image = "#wordImg" + index;
    var label = "#wordLbl" + index;

    if (checked) {
        $(image).attr("src", "http://societic.ibercivis.es/semantics/images/activeRow.png");
        $(label).css({ color: '#2B3126' });
    }
    else {
        $(image).attr("src", "http://societic.ibercivis.es/semantics/images/empty_row.png");
        $(label).css({ color: 'white' });
    }    
    $(label).text(word);
}

function setWordBarEndItem(index) {
    var image = "#wordImg" + index;
    $(image).attr("src", "http://societic.ibercivis.es/semantics/images/endrow.png");
        
    //var label = "#wordLbl" + index;
    //$(label).css({ color: '#2B3126' });
    //$(label).text(adjustCase(endWord));
}

function completed() {
    // Set the endword label color    
    setWordBarEndItem(steps);

    // stop timers
    stopTimer();

    // Build answer
    var answer = wordsPath[0];
    for (var i = 1; i < pathIndex; i++) {
        answer = answer + '~' + wordsPath[i];
    }
    // Show dialog
    $('#completedDialog').modal('show');

    // save only with a regular steps count
    if (steps < 25) {
        pybossa.saveTask(taskId, answer).done(
          function (data) {
              // Show the feedback div
              //$("#success").fadeIn();
              // Fade out the pop-up after a 1000 miliseconds
              //setTimeout(function() { $("#success").fadeOut() }, 1000);             
              deferredTask.resolve();
          });
    }
}

/* MISC Functions */
function ChangeImage(img, url) {
    img.src = url;
}

function adjustCase(word) {
    var character = word[0];
    word = word.toLowerCase();
    word = character + word.substr(1, word.length);
    return word;
}

function openShareWindow(url) {
    window.open(url, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=yes, width=500, height=300");
}

function shuffle(array) {
    var currentIndex = array.length
      , temporaryValue
      , randomIndex
    ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function toggleResetButton(state){
	if (state){
		$("#lnkReset").removeAttr("disabled");
		$("#imgResetButton").removeAttr("disabled");	
		$('#imgResetButton').css('cursor', 'pointer');		
	}
	else {
		$("#lnkReset").attr("disabled", "disabled");
		$("#imgResetButton").attr("disabled", "disabled");
		$('#imgResetButton').css('cursor', 'default');		
	}
	ChangeImage(document.getElementById('imgResetButton'),'http://societic.ibercivis.es/semantics/images/reset.png')
	resetState = state;
}