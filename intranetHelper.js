'use strict';
var rp = require('request-promise');

function fetchUserProfile(userMail) {
  return rp(process.env.INTRANET+'/user/me?access_token='+process.env.ROBOT_TOKEN+'&user='+userMail);
}


function fecthChange() {
  return rp(process.env.INTRANET+'/change');
}

function rqPayment(email,pesos,dolares) {
  console.log('\n urlPayment='+process.env.INTRANET+'slack_payment?access_token='+process.env.ROBOT_TOKEN+'&user='+email+'&dollars='+dolares+'&deposit='+pesos);
  return rp(process.env.INTRANET+'/slack_payment?access_token='+process.env.ROBOT_TOKEN+'&user='+email+'&dollars='+dolares+'&deposit='+pesos);
}


exports.getLevel = function(userMail) {
  return fetchUserProfile(userMail).then(function(res) {
    var json = JSON.parse(res);
      if (json.error) {
          throw new Error('No se pudo obtener el nivel del mail '+userMail);
      }
      else {
        return json.level.rate;
      }
  });
};

exports.getChange = function(){
  return fecthChange().then(function(res){
    var json = JSON.parse(res);
      if (json.error) {
        throw new Error ('No se pudo obtener cambio');
      }
      else {
        console.log('\n');
        console.log('\n');
        console.log('\n');
        console.log('getChange');
        console.log(json.buy);
        return json.buy;
      }
  });
};


exports.payment = function(mail,pesos,dolares){
  return rqPayment(mail,pesos,dolares).then(function(res){
    var json = JSON.parse(res);
    if (json.error){
      throw new Error ('No se pudo hacer el pago');
    } else {
      return "";
    }
  });
};



// SAVE USER PAYMENT
