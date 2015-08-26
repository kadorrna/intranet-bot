'use strict';

var WebSocket = require('ws'),
    robotUrl = "https://slack.com/api/rtm.start?token=" + process.env.BOT_TOKEN,
    request = require("request"),
    slack = require('./slackHelper'),
    intra = require('./intranetHelper'),
    commands = require("./commands.js"),
    fn = require("./functions.js"),
    _ = require('lodash');


var activeCommands = 0;
var resetWhenIdle = false;



commands.help.configure("uso command:[param1]+[param2]+...", function (commandName, description, params, command) {
        var note = "";
        if (command.private) {
            note = " (solo mensaje privado)";
        }
        return "`" + commandName + "`: " + description + note + "\n" + params + "\n";
    }, function (paramName, description) {
        return "        `" + paramName + "` " + description + "\n";
});

request(robotUrl, function(err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body);
    if (res.ok) {
      connectWebSocketIntranet(res.url);
    }
  }
});

function connectWebSocketIntranet(url) {

  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });

  ws.on('message', function(message) {
      message = JSON.parse(message);
      var command = null;
      var commandArgs = [];
      var args, commandName;

      if (_.startsWith(message.channel, "D" ) && (message.type === "message") && (message.user != "U081MUY5P")){

        var text = message.text;
        var userID = message.user;

        args = /(\w*)\s*\:(.*)/.exec(text);
        if (args) {
          console.log("ARGS -> " + args);
          commandName = args[1].trim();
          commandArgs = fn.splitSlackParams(args[2]);
          command = commands[commandName];
        }
        else if (text) {
          // command (?)
          command = commands[text.trim().replace(/(\?|\s)/,'')];
        }

        command.execute(commandArgs, userID, function (response, more) {
            var end = function () {
              if (!more) activeCommands--;
              if (resetWhenIdle && activeCommands === 0) {
                ws.close();
              }
            };
            var text = "@bot: " + (response.text || "");
            if (response.text) {
              sendMessage(ws, message, text);
              end();
            }
            else {
              end();
            }
          });
      }
    });
  }

var _nextId = 1;
function nextId() {
  	return _nextId++;
}

function sendMessage(ws, message, text) {
       ws.send(JSON.stringify({
           channel: message.channel,
           id: nextId(),
           text: text,
           type: "message",
           reply_to : message.id
       }));
}
