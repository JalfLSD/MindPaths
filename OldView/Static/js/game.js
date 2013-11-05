// Settings
//var serverUrl = "http://127.0.0.1:5000/";
var serverUrl = "http://societic.ibercivis.es/semantics-backend/";
// Game State
var resizeWords = false;
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
var linksPath = new Array();
var deferredTask;
var wtProgress;
var gtProgress;
var wordTimePercent;

// Start a new game round
function startGame(task, deferred) {
    // Get task info
    startWordId = task.info.start;
    startWord = task.info.startWord;
    endWordId = task.info.end;
    endWord = task.info.endWord;
    taskId = task.id;
    deferredTask = deferred;    
    resetGame();
}

function resetGame() {
    steps = 0;
    pathIndex = 0;
    wordsPath.length = 0;
    linksPath.length = 0;
    
    activeWord = startWord;
    activeWordId = startWordId;
    // Add the first word in the path
    resetWordBar();
    wordsPath[pathIndex] = activeWord;
    pathIndex++;
    // Update HUD
    $("#wordLbl0").text(adjustCase(startWord));
    $("#lblEndWord").text(endWord);
    $("#lblSteps").text("Your Path:");
    $("#lblQuestion").html("What is the path from '<b>" + startWord + "</b>' to '<b>" + endWord + "</b>' ?");    
    addWords();
    $("#mainDivGame").fadeIn(500);
    
    // Start clocks
    resetWordClock();
    resetGameClock();
}
        
function WordTimeOut()
{    
    $('#timeoutDialog').modal('show')
}

function jump() {
    window.location = "http://pybossa.socientize.eu/pybossa/app/Semantics/newtask";
}
        
function resetWordBar() {
    for (var i = 1; i < 27; i++) {
        setWordBarItem(i, false);
        setWordBarLabel(i, "-");
    }
}

function setWordBarItem(index, checked) {
    var image = "#wordImg" + index;
    var label = "#wordLbl" + index;
    if (checked) {
        $(image).attr("src", "http://societic.ibercivis.es/semantics/static/images/activeRow.png");
        $(label).css({ color: '#e75545' });
    }
    else {
        $(image).attr("src", "http://societic.ibercivis.es/semantics/static/images/empty_row.png");
        $(label).css({ color: 'white' });
    }
}

function setWordBarEndItem(index) {
    var image = "#wordImg" + index;
    $(image).attr("src", "http://societic.ibercivis.es/semantics/static/images/endrow.png");
    var label = "#wordLbl" + index;
    $(label).css({ color: '#2b3127' });
}

function setWordBarLabel(index, word) {
    var item = "#wordLbl" + index;
    $(item).text(word);
}

function startOver() {
    if (steps == 0)
        return;

    setWordBarItem(steps, false);
    setWordBarLabel(steps, "-");    
    steps--;

    wordsPath[pathIndex] = "(RESET)";
    pathIndex++;

    activeWord = startWord;
    activeWordId = startWordId;
    addWords();
    
    // start clocks
    resetGameClock();
    resetWordClock();
}
        
function setupCloud() {
    try {
        TagCanvas.Start('myCanvas', 'tags', {
            textColour: '#72727',
            textHeight: 16,
            freezeActive: true,
            freezeDecel: true,
            wheelZoom: false,
            outlineMethod: 'outline',
            outlineColour: 'black',
            shuffleTags: true,
            reverse: true,
            depth: 0.8,
            weight: resizeWords,
            shadowBlur: 1,
            shape: 'sphere',
            radiusZ: 0,
            maxSpeed: 0,
            centreFunc: DrawCenterText
        });
    } catch (e) {
        // something went wrong, hide the canvas container
        document.getElementById('myCanvasContainer').style.display = 'none';
    }
};

function DrawCenterText(context2D, width, height, centreX, centreY) {
    context2D.setTransform(1, 0, 0, 1, 0, 0);
    context2D.font = "bold 18px Arial";
    var measure = context2D.measureText(activeWord.toUpperCase());
    context2D.fillStyle = '#e75545';
    context2D.globalAlpha = 1;
    context2D.fillText(activeWord.toUpperCase(), centreX - (measure.width / 2) - 2, centreY - 5);
};
       
function adjustCase(word) {    
    var char = word[0];
    word = word.toLowerCase();
    word = char + word.substr(1, word.length);
    return word;
}


function addWord(word, size, link) {
    $("#taglist").append('<li><a href="#" onclick="' + link + ';return false" style="font-size: ' + size + 'pt">' + word + '</a></li>');
};

function addWords() {
    $("#taglist").empty();
    $('#myCanvasContainer').fadeOut();
    // Call the service
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                var json = request.responseText;
                var parts = json.split('~');
                var count = parts[0];
                for (var i = 0; i < count; i++) {
                    var id = parts[(i * 3) + 1];
                    var weight = parts[(i * 3) + 2];
                    var word = adjustCase(parts[(i * 3) + 3]);
                    
                    // Check if this link was already choosen
                    var used = false;
                    var link = activeWordId + "-" + id;
                    for (var k = 0; k < pathIndex && !used; k++) {
                        used = linksPath[k] == link;
                    }
                    if (!used)
                        addWord(word, weight, "javascript:wordSelected(" + id + ",'" + word + "');return false;");
                }

                setupCloud();
                $('#myCanvasContainer').fadeIn();                
            } else {
                alert("error: " + request.status);
            }
        }
    };
    request.open('GET', serverUrl+'links/' + activeWordId, true);
    request.send();
};

function wordSelected(id, text) {
    if (text != startWord) {
        if (steps < 25) {
            addWordPath(text);
            setWordBarItem(steps, true);
            setWordBarLabel(steps, activeWord);
        }
        else {
            setWordBarLabel(25, '...');
        }
    }
    
    $("#taglist").empty();
    
    // Save the used link
    linksPath[pathIndex] = activeWordId + "-" + id;

    activeWordId = id;
    activeWord = text;
    
    if (id == endWordId) {
        completed();       
    }
    else addWords();
}

function completed() {   
    // Set the endword label color
    setWordBarItem(steps, false);
    setWordBarEndItem(steps);     

    // stop timers
    gtProgress.stop();
    wtProgress.stop();

    // Build answer
    var answer = wordsPath[0];
    for (var i = 1; i < pathIndex; i++) {
        answer = answer + '~'+wordsPath[i];
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

function addWordPath(word) {
    steps++;
    wordsPath[pathIndex] = word + "~" + (wordTimePercent * 0.6);
    pathIndex++;

    activeWord = word;

    if (steps == 25) {
        alert("Your path is too long to be used, but keep playing!");
    }

    // Reset word clock
    resetWordClock();
}


function resetWordClock() {
    if (wtProgress) {
        wtProgress.destroy();
    }
    wtProgress = $('#wordTimeClock').cprogress({
        percent: 0, // starting position
        img1: 'http://societic.ibercivis.es/semantics/static/images/wTime.png', // background
        img2: 'http://societic.ibercivis.es/semantics/static/images/wTimeEnd.png', // foreground
        speed: 600, // speed (timeout)
        PIStep: 0.05, // every step foreground area is bigger about this val
        limit: 100, // end value
        loop: false, //if true, no matter if limit is set, progressbar will be running
        showPercent: false, //show hide percent
        onInit: function () { wordTimePercent = 0; },
        onProgress: function (p) { wordTimePercent = p; }, //p=current percent        
        onComplete: function (p) { WordTimeOut(); } //p=current percent            
    });
}

function resetGameClock() {    
    if (gtProgress) {
        gtProgress.destroy();
    }
    gtProgress = $('#gameTimeClock').cprogress({
        percent: 1, // starting position
        img1: 'http://societic.ibercivis.es/semantics/static/images/gTime.png', // background
        img2: 'http://societic.ibercivis.es/semantics/static/images/gTimeEnd.png', // foreground
        speed: 18000, // speed (timeout)
        PIStep: 0.05, // every step foreground area is bigger about this val
        limit: 100, // end value
        loop: false, //if true, no matter if limit is set, progressbar will be running
        showPercent: false, //show hide percent
        //onInit: function () { console.log('onInit'); },
        //onProgress: function (p) { console.log('onProgress', p); }, //p=current percent            
        onComplete: function (p) { WordTimeOut(); } //p=current percent         
    });
    gtProgress.reset();
}


/* MISC Functions */
function ChangeImage(img, url) {
    img.src = url;
}