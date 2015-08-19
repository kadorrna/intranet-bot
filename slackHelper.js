'use strict';
var rp = require('request-promise'),
    robotToken = "xoxb-8055984193-DRM5vkJ4MEmdgZ6wdgYVF1Y4";

function fetchUserProfile(userID) {
  return rp('https://slack.com/api/users.info?token='+robotToken+'&user='+userID);
}

exports.getUserMail = function(userID) {
  return fetchUserProfile(userID).then(function(slackRes) {
    var json = JSON.parse(slackRes);
      if (json.error) {
          throw new Error('User is not authorized');
      }
      else {
        return json.user.profile.email;
      }
  });
};
