// Settings
//var serverUrl = "http://127.0.0.1:5000/";
var serverUrl = "http://societic.ibercivis.es/semantics-backend/";
var maxGraphLevel = 3;
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
var wordsId = new Array();
var linksPath = new Array();
var deferredTask;
var wtProgress;
var gtProgress;
var wordTimePercent;
var ht = null;
var nodeCount = 0;
var activeNodeId;

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
    wordsId.length = 0;
    linksPath.length = 0;
    nodeCount = 0;
    
    activeWord = startWord;
    activeWordId = startWordId;
    // Add the first word in the path
    resetWordBar();
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
        
function WordTimeOut() {
    $('#timeoutDialog').modal('show');
}

function jump() {
    //location.reload(true);
    window.location = "http://test.pybossa.socientize.eu/pybossa/app/Semantics/newtask";
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
    wordsId[pathIndex] = -1;
    pathIndex++;

    activeWord = startWord;
    activeWordId = startWordId;
    addWords();
    
    // start clocks
    resetGameClock();
    resetWordClock();
}
        
function setupCloud(graphNodes) {
    var graph = document.getElementById('myGraphContainer');
    var w = graph.offsetWidth - 50, h = graph.offsetHeight - 50;

    //init Hypertree
    if (ht == null) {
        ht = new $jit.Hypertree({
            //id of the visualization container
            injectInto: 'myGraphContainer',
            //canvas width and height
            width: w,
            height: h,
            //Change node and edge styles such as
            //color, width and dimensions.
            Node: {
                dim: 9,
                color: "#2b3127"
            },
            Edge: {
                lineWidth: 2,
                color: "#c2c3c8"
            },

            //Attach event handlers and add text to the
            //labels. This method is only triggered on label
            //creation
            onCreateLabel: function(domElement, node) {
                domElement.innerHTML = node.name;                           
            },

            //Change node styles when labels are placed or moved.
            onPlaceLabel: function (domElement, node) {

                var style = domElement.style;
                domElement.onclick = null;                
                domElement.innerHTML = node.name;
                style.cursor = 'default';
                                
                if (node._depth == 0) {
                    domElement.innerHTML = node.name.toUpperCase();
                    style.fontFamily = "Helvetica, Arial";
                    style.fontWeight = "bold";
                    style.fontSize = "18px";
                    style.color = "#E75545";
                } else if (node._depth == 1) {
                    var parent = node.getParents()[0];
                    if  (node.getSubnodes().length > 1 && parent.data.wordId == activeWordId) {
                        style.color = "gray";
                    } else {
                        style.cursor = 'pointer';                        
                        style.color = "#72727";
                        domElement.onclick = function () {
                            wordSelected(node);
                        };
                    }
                    style.fontFamily = "Helvetica, Arial";
                    style.fontSize = "16px";
                    style.fontWeight = "bold";
                }
                else if (node._depth == 2) {
                    style.fontFamily = "Helvetica, Arial";
                    style.fontSize = "10px";
                    style.color = "gray";
                } else if (node._depth == 3) {
                    style.fontFamily = "Helvetica, Arial";
                    style.fontSize = "5px";
                    style.color = "gray";
                } else {
                    style.display = "none";
                }

                var left = parseInt(style.left);
                var w = domElement.offsetWidth;
                style.left = (left - w / 2) + 'px';
            },
        });
    }

    //load JSON data.
    ht.loadJSON(graphNodes);
    //compute positions and plot.
    ht.refresh();
    //end
    ht.controller.onComplete();
};
      
function adjustCase(word) {    
    var character = word[0];
    word = word.toLowerCase();
    word = character + word.substr(1, word.length);
    return word;
}

function getChildNodes(node) {
    var request = new XMLHttpRequest();
    var jsonWordsData = new Array();
    
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                var json = request.responseText;
                var parts = json.split('~');
                var count = parts[0];
                
                node.children = new Array();

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
                    if (!used) {
                        var newNode = {
                            "id": nodeCount++,
                            "name": word,
                            "data": { "wordId": id },
                            "children": []
                        };
                        jsonWordsData.push(newNode);
                    }                                        
                }
                
                // Center node
                ht.onClick(node.id, {
                    onComplete: function () {                     
                        // Add new graph
                        ht.root = node.id;
                        for (var k = 0; k < jsonWordsData.length; k++) {
                            ht.graph.addAdjacence(node, jsonWordsData[k]);                            
                        }
                        
                        ht.op.sum(jsonWordsData, {
                            type: 'fade:con',
                            duration: 1000,
                            hideLabels: false,
                            onComplete: function() {                                
                            }
                        });
                        
                        // Remove old nodes
                        if (pathIndex > maxGraphLevel) {
                            var delId = wordsId[pathIndex - (maxGraphLevel+1)];
                            var n = ht.graph.getNode(delId);
                            if (n != undefined) {
                                var subnodes = n.getSubnodes(0);
                                var map = [];
                                for (var k = 0; k < subnodes.length; k++) {
                                    map.push(subnodes[k].id);
                                }
                                //perform node-removing animation.  
                                ht.op.removeNode(map.reverse(), {
                                    type: 'fade',
                                    duration: 1000,
                                    hideLabels: false,
                                    onComplete: function () {
                                        ht.refresh();
                                    }
                                });
                            }                            
                        }
                        ht.controller.onComplete();
                    }
                });
            } else {
                alert("error: " + request.status);
            }
        }        
    };
    request.open('GET', serverUrl + 'links/' + node.data.wordId, true);
    request.send();
}

function addWords() {
    // Call the service
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                var json = request.responseText;
                var parts = json.split('~');
                var count = parts[0];
                var graphNodes = {
                    "id": nodeCount++,
                    "name": adjustCase(activeWord),
                    "data": { "wordId" : activeWordId },
                    "children": []
                };
                
                wordsPath[pathIndex] = graphNodes.name;
                wordsId[pathIndex] = graphNodes.id;
                pathIndex++;

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
                    if (!used) {
                        graphNodes.children.push(
                            {
                                "id": nodeCount++,
                                "name": word,
                                "data": { "wordId": id },
                                "children": []
                            }
                        );
                    }
                }

                setupCloud(graphNodes);
            } else {
                alert("error: " + request.status);
            }
        }
    };
    request.open('GET', serverUrl+'links/' + activeWordId, true);
    request.send();
};

function wordSelected(node) {
    if (node.name != startWord) {
        if (steps < 25) {
            addWordPath(node.name, node.id);
            setWordBarItem(steps, true);
            setWordBarLabel(steps, activeWord);
        }
        else {
            setWordBarLabel(25, '...');
        }
    }
    
    // Save the used link
    linksPath[pathIndex] = activeWordId + "-" + node.data.wordId;

    activeWordId = node.data.wordId;
    activeWord = node.name;
    
    if (node.data.wordId == endWordId) {
        completed();       
    }
    else getChildNodes(node);
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

function addWordPath(word, wordid) {
    steps++;
    wordsPath[pathIndex] = word + "~" + (wordTimePercent * 0.6);
    wordsId[pathIndex] = wordid;
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