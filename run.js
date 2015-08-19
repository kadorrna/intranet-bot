'use strict';

var dotenv = require('dotenv');
dotenv.config({
  silent: true
});
dotenv.load();

var WebSocket = require('ws'),

    //authUrl = "https://slack.com/api/rtm.start?token=" + process.env.API_TOKEN,
    robotUrl = "https://slack.com/api/rtm.start?token=" + process.env.ROBOT_TOKEN,
    request = require("request"),
    rp = require('request-promise'),
    slack = require('./slackHelper'),
    intra = require('./intranetHelper'),
    errorSlackMsg = 'Hubo un error',
    _ = require('lodash');


/*
request(robotUrl, function(err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body);
    if (res.ok) {
      connectWebSocketDollar(res.url);
    }
  }
});
*/

request(robotUrl, function(err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body);
    if (res.ok) {
      connectWebSocketIntranet(res.url);
    }
  }
});

function errorResponse(error, ws,messageChannel){
  console.log('\n'+error+'\n');
  ws.send(JSON.stringify({ channel: messageChannel, id: 1, text:errorSlackMsg, type: "message" }));
  errorSlackMsg = 'Hubo un error';
}

function convertToPesos(dollars){
  return intra.getChange().then(function(change){
      return (change * dollars);
  });
}

function responseToMail(userID, ws, message){
  return slack.getUserMail(userID).then(function(email) {
    ws.send(JSON.stringify({ channel: message.channel, id: 1, text:'tu emilio es='+email, type: "message" }));
  });
}

function getLevel(userID) {
  return slack.getUserMail(userID).then(intra.getLevel);
}

function responseToLevel(userID, ws, message){
  return getLevel(userID).then(function(level){
    ws.send(JSON.stringify({ channel: message.channel, id: 1, text:'Estas en '+level+' dolares', type: "message" }));
  });
}

function responseToValorDolar(userID, ws, message){

  return intra.getChange().then(function(change) {
    if (change){
      console.log('Entro aca='+change);
      ws.send(JSON.stringify({ channel: message.channel, id: 2, text:change, type: "message" }));
    } else {
      errorSlackMsg = "Algo mal";
      throw new Error('Imposible traer el valor del dolar');
    }
  });
}


function getLevelPesos(userID){
  return slack.getUserMail(userID)
        .then(intra.getLevel)
        .then(convertToPesos);
}

function responseToLevelPesos(userID, ws, message){
  return getLevelPesos(userID).then(function(dollarsPesosValue){
          ws.send(JSON.stringify({ channel: message.channel, id: 1, text:'Estas en '+dollarsPesosValue+' pesos', type: "message" }));
        });
}

function paymentIsPossible(userID, dollars, pesos){
  return getLevelPesos(userID).then(function(levelInPesos){
     return intra.getChange().then(function(change){
       var asked = parseInt(dollars * change) + parseInt(pesos);
       if (parseInt(levelInPesos) < parseInt(asked)) {
         return false;
       } else {
         return true;
       }
     });
  });

}

function responseToPayment(userID,ws,message){
  var msg = message.text.toLowerCase();
  return slack.getUserMail(userID)
          .then(function(email){
            var setPayment = true;
            var pesos = msg.split("depositar:");
            if (!pesos[1]){
              setPayment = false;
              ws.send(JSON.stringify({ channel: message.channel, id: 1, text:'El formato deberia ser: "Quiero depositar:x dolares:y"', type: "message" }));
              throw new Error('No seteo pesos');
            } else {
              pesos = pesos[1].split(" ");
              pesos = pesos[0];
            }

            var dollars = msg.split("dolares:");
            if (!dollars[1]){
              setPayment = false;
              errorSlackMsg = 'El formato deberia ser: "Quiero pesos:x dolares:y"';
              throw new Error('No seteo dolares');
            } else {
              dollars = dollars[1].split(" ");
              dollars = dollars[0];
            }

            return paymentIsPossible(userID, dollars, pesos).then(function(isPossible){
              if (isPossible){
                intra.payment(email,pesos,dollars).then(function(){
                  ws.send(JSON.stringify({ channel: message.channel, id: 1, text:'El pago fue seteado correctamente', type: "message" }));
                });
              } else {
                errorSlackMsg = "El monto ingresado supera su nivel";
                throw new Error('Not possible to pay you that');
              }

            });
        });
}

function isSetingPayment(msg){
  var msgMin = msg.toLowerCase();
  var pesos = msgMin.search("depositar");
  var dolares = msgMin.search("dolares");

  if ((dolares >= 0) && (pesos >= 0)){
    return true;
  } else {
    return false;
  }
}

function connectWebSocketIntranet(url) {

  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });

  ws.on('message', function(message) {
      message = JSON.parse(message);

      if (_.startsWith(message.channel, "D" ) && (message.type === "message") && (message.user != "U081MUY5P")){
        var userID = message.user,
            isAskingMail = (message.text === "puto"),
            isAskingLevel = (message.text === "cuanto?"),
            isAskingLevelPesos = (message.text === "cuantos pesos?"),
            isAskingValorDolar = (message.text === "valorDolar"),
            response;

        if (isAskingMail){
          response = responseToMail(userID,ws,message);
        }
        if (isAskingLevel){
          response = responseToLevel(userID, ws, message);
        }

        if (isAskingLevelPesos){
          response = responseToLevelPesos(userID, ws, message);
        }

        if (isSetingPayment(message.text)){
          response = responseToPayment(userID,ws,message);
        }

        if (isAskingValorDolar){
          response = responseToValorDolar(userID, ws, message);
        }

        if (!response){
            errorResponse("Mensaje no valido", ws, message.channel);
        }else{
          response.catch(function(error){
              console.log('\n\nENTRO AL CATCH');
              errorResponse(error, ws, message.channel);
          });
        }
      }
  });
}

/*
function connectWebSocketDollar(url) {

  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });

  ws.on('message', function(message) {
    message = JSON.parse(message);
      var msgStr = message.text;
      var valorDolar =_.startsWith(msgStr, "valorDolar");

       if (valorDolar) {
         console.log('received:', message);
         ws.send(JSON.stringify({ channel: 'D082X5UHF', id: 1, text:'PUTO', type: "message" }));

        intra.getChange().then(function(dollarChange) {
          console.log('DOLLAR CHANGE = '+dollarChange);
          console.log('Message:'+JSON.stringify(message));
          //ws.send(JSON.stringify({ channel: message.channel, id: 1, text:dollarChange, type: "message" }));
          response = responseToValorDolar(userID, ws, message, dollarChange);

      }).catch(function() {
          console.log("error trayendo dolar");
      });


      }
  });
}
*/
