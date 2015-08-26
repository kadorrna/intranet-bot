
var slack = require('./slackHelper'),
intra = require('./intranetHelper');

function getLevel(userID) {
  return slack.getUserMail(userID).then(intra.getLevel);
}

function getLevelPesos(userID){
  return slack.getUserMail(userID)
        .then(intra.getLevel)
        .then(convertToPesos);
}

function convertToPesos(dollars){
  return intra.getChange().then(function(change){
      return (change * dollars);
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

commands = {
    hola: {
        help: {
            description: "te devuelve el saludo cuando llegás."
        },
        execute: function (params, userID, then) {
            then(reply(true, "Hola che!"));
        }
    },
    chau: {
        help: {
            description: "te devuelve el saludo cuando te vas."
        },
        execute: function (params, userID, then) {
            then(reply(true, "Chau che!"));
        }
    },
    valorDolar: {
        help: {
            description: "te devuelve el valor del dolar."
        },
        execute: function (params, userID, then) {
          console.log('Funciona valorDolar');
          intra.getChange().then(function(change) {
              if (change){
                console.log('change='+change);
                then(reply(true, ''+change));
              } else {
                then(reply(false, 'Imposible traer el valor del dolar'));
              }
          });
        }
    },

    cuanto:{
      help: {
          description: "te devuelve el valor del cuanto te corresponde en dolares."
      },
      execute: function (params, userID, then) {
        getLevel(userID).then(function(level){
          then(reply(true, 'Estas en '+level+' dolares'));
        });

      }
    },

    cuantospesos:{
      help: {
          description: "te devuelve cuantos pesos corresponden a tu nivel con la cotizcion que usa la intranet"
      },
      execute: function (params, userID, then) {
        getLevelPesos(userID).then(function(dollarsPesosValue){
                then(reply(true, 'Estas en '+dollarsPesosValue+' pesos'));
              });
      }
    },

    configurar:{
      help: {
          description: "Setear pesos a depositar + dolarares en mano",
          params: ["depositar", "dolares"],
          helpParams: {
              depositar: "Pesos a Depositar",
              dolares: "Dolar en mano"
          }
      },
      execute: function (params, userID, then) {

        slack.getUserMail(userID)
                .then(function(email){
                  var setPayment = true;
                  if (params.length != 2){
                    then(reply(true,'El mensaje deberia ser configurar:a_depositar dolares'));
                  }else{
                    var pesos = params[0];
                    var dollars = params[1];
                    paymentIsPossible(userID, dollars, pesos).then(function(isPossible){
                      if (isPossible){
                        intra.payment(email,pesos,dollars).then(function(){
                          then(reply(true,'El pago fue seteado correctamente'));
                        });
                      } else {
                          then(reply(false,'El monto ingresado supera su nivel'));
                      }
                    });
                  }
                });
      }
    },
    help: {
        help: {
            description: "muestra esta ayuda",
            params: ["command"],
            helpParams: {
                "command": "el comando que se quiere conocer (opcional)"
            }
        },
        private: true,
        execute: function (_params, userID, then) {
            var helpText = this.useMode + "\n";
            var format = function (name) {
                var command = commands[name];
                var help = command.help;
                var description = "";
                var params = "";
                if (help && help.description) {
                    description = help.description;
                }
                if (help && help.params) for (var paramIndex in help.params) {
                    var param = help.params[paramIndex];
                    params += this.formatParam(param, help.helpParams[param]);
                }
                helpText += this.formatHelp(name, description, params, command);
            }.bind(this);
            if (_params.length < 1 || !commands[_params[0]]) {
                for (var name in commands) {
                    format(name);
                }
            }
            else {
                format(_params[0]);
            }
            then(reply(true, helpText));
        },
        configure: function (useMode, formatHelp, formatParam) {
            this.useMode = useMode;
            this.formatHelp = formatHelp;
            this.formatParam = formatParam;
        }
    }
};

function reply(success, text, attachment) {
    return {
        success: success,
        text: text,
        attachment: attachment
    };
}

module.exports = commands;
