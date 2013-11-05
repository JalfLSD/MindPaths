var audioExt;
var myAudio = document.createElement('audio');

if (myAudio.canPlayType) {
    if (!!myAudio.canPlayType && "" != myAudio.canPlayType('audio/mpeg'))
        audioExt = ".mp3";
    else if (!!myAudio.canPlayType && "" != myAudio.canPlayType('audio/ogg; codecs="vorbis"'))
        audioExt = ".ogg";
}

// Load sounds
var checkSound = loadSound("audio/check");
var endRoundSound = loadSound("audio/endround");

function loadSound(name) {
    return new window.Audio(name + audioExt);
}