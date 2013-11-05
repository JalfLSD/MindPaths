// Setup
var FACEBOOK_DONE_CALLBACK = 'fbDone';
var FACEBOOK_APP_ID = '450706478277058';
var FACEBOOK_APP_URL = "https://apps.facebook.com/feelthemusic/";

// Globals
var FACEBOOK_UID;
var FACEBOOK_ACCESSTOKEN;
var FACEBOOK_PROFILE_IMAGE = '';
var FACEBOOK_STATUS = '';
var FACEBOOK_USER_INFO = undefined;

// Main initialize function
//window.fbAsyncInit = function () {
function InitalizeFacebook() {
    // Check the configuration
    if (typeof FACEBOOK_APP_ID === 'undefined') {
        alert("You must define FACEBOOK_APP_ID");
        return;
    }
    if (typeof FACEBOOK_APP_URL === 'undefined') {
        alert("You must define FACEBOOK_APP_URL");
        return;
    }

    // Add the facebook DIV element
    var div = document.getElementById('fb-root');
    if (!div) {
        var facebookdiv = document.createElement('div');
        facebookdiv.setAttribute('id', 'fb-root');
        document.body.appendChild(facebookdiv);
    }

    // Initialize the Facebook API
    FB.init({
        appId: FACEBOOK_APP_ID, // App ID
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        frictionlessRequests: true,  // enable frictionless requests
        xfbml: true  // parse XFBML
    });

    FB.Event.subscribe('auth.statusChange', checkAuthentication);
};

// Load the Facebook SDK Asynchronously
//(function (d) {
//    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
//    if (d.getElementById(id)) { return; }
//    js = d.createElement('script'); js.id = id; js.async = true;
//    js.src = "//connect.facebook.net/en_US/all.js";
//    ref.parentNode.insertBefore(js, ref);
//} (document));


// Check authentication
function checkAuthentication(response) {
    // Redirect to authentication or authorization, if needed
    FACEBOOK_STATUS = response.status;
    FACEBOOK_UID = '';
    FACEBOOK_ACCESSTOKEN = '';
    FACEBOOK_PROFILE_IMAGE = '';

    if (response.status === 'connected') {
        // the user is logged in and has authenticated your
        // app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed
        // request, and the time the access token 
        // and signed request each expire
        FACEBOOK_UID = response.authResponse.userID;
        FACEBOOK_ACCESSTOKEN = response.authResponse.accessToken;
        FACEBOOK_PROFILE_IMAGE = "http://graph.facebook.com/" + FACEBOOK_UID + "/picture";

        // Call the user initialization callback function
        if (FACEBOOK_DONE_CALLBACK != undefined) {
            window[FACEBOOK_DONE_CALLBACK]();
        }
            
    } else if (response.status === 'not_authorized') {
        // the user is logged in to Facebook, 
        // but has not authenticated your app
        doEnableApp();
    } else {
        // the user isn't logged in to Facebook.
        doFBLogin();    
    }
}

function doEnableApp() {
    window.top.location = "https://www.facebook.com/dialog/oauth/?client_id=450706478277058&redirect_uri=" + FACEBOOK_APP_URL + "&scope=publish_stream,publish_actions,user_birthday";
}

function
 doFBLogin() {
    window.top.location = "http://www.facebook.com/connect/uiserver.php?app_id=450706478277058&next=" + FACEBOOK_APP_URL + "&display=page&perms=publish_stream,publish_actions,user_birthday&fbconnect=1&method=permissions.request";
}

// Call the dialog to share the app with friends
function shareApp(shareTitle, shareMessage, callback) {
    FB.ui({ method: 'apprequests', title: shareTitle, message: shareMessage, filters: ['app_non_users'] }, callback);
}

function postToFeed(imageUrl, name, title, message, link, callback) {

    // calling the API ...
    var obj = {
        method: 'feed',
        link: link,
        picture: imageUrl,
        name: name,
        caption: title,
        description: message
    };

    FB.ui(obj, callback);

    // Sample callback
    //function callback(response) {
    //    document.getElementById('msg').innerHTML = "Post ID: " + response['post_id'];
    //}

}

function postScore(value, callback) {
    FB.api("/me/scores", 'post', { score: value, access_token: FACEBOOK_ACCESSTOKEN }, callback);
}

function getUserInfo() {
    FB.api("/me", function (response) {
        if (!response || response.error) {
            FACEBOOK_USER_INFO = "error";
        } else {
            FACEBOOK_USER_INFO = response;
        }
    });
}