

"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;


var VectorWatch = require('vectorwatch-browser');
var request = require('request');
var Schedule = require('node-schedule');
var StorageProvider = require('vectorwatch-storageprovider');

var vectorWatch = new VectorWatch();
var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');
    response.send();
});

vectorWatch.on('subscribe', function(event, response) {


    var streamText;
    var settings = event.getUserSettings().settings;
    try {
        getTrafic().then(function(body) {
            var rers = body.response.rers;
            if(rers[0].title === "Trafic normal" && rers[1].title === "Trafic normal"){
                streamText = "Trafic normal";        
            } else if(rers[0].title !== "Trafic normal"){
                streamText = "RER A - KO";        
            } else if(rers[1].title !== "Trafic normal"){
                streamText = "RER B - KO";        
            }
            
            response.setValue(streamText);
            response.send();
            
        }).catch(function(e) {
            response.setValue("ERROR 1");
            response.send();
        });

    } catch(err) {
        response.setValue("ERROR 2");
        response.send();
    }
	
});


function getTrafic() {
    return new Promise(function (resolve, reject) {
        var url = "url_to_ratp";

        request(url, function (error, httpResponse, body) {
            if (error) {
                reject('REST call error: ' + error.message + ' for ' + url);
                return;
            }

            if (httpResponse && httpResponse.statusCode != 200) {
                reject('REST call error: ' + httpResponse.statusCode + ' for ' + url);
                return;
            }

            try {
                body = JSON.parse(body);
                resolve(body);
            } catch(err) {
                reject('Malformed JSON response from ' + url + ': ' + err.message);
            }

        });
    });
}

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});




function pushUpdates() {
    var streamText;
    try {
        getTrafic().then(function(body) {
            var rers = body.response.rers;
            if(rers[0].title === "Trafic normal" && rers[1].title === "Trafic normal"){
                streamText = "Traffffic normal";        
            } else if(rers[0].title !== "Trafic normal"){
                streamText = "RER A - KO";        
            } else if(rers[1].title !== "Trafic normal"){
                streamText = "RER B - KO";        
            }
            
	
			storageProvider.getAllUserSettingsAsync().then(function(records) {
				records.forEach(function(record) {
					// record.userSettings
					vectorWatch.pushStreamValue(record.channelLabel, streamText);
				});
			});            
					
			
        }).catch(function(e) {
            //logger.error(e);
            response.setValue("ERROR");
            response.send();
        });

        //logger.info('on subscribe: ' + streamText);
    } catch(err) {
        //logger.error('on subscribe - malformed user setting: ' + err.message);
        response.setValue("ERROR");
        response.send();
    }	
	

}

function scheduleJob() {
    var scheduleRule = new Schedule.RecurrenceRule();
    scheduleRule.minute = [0,5,10,15,20,25,30,35,40,45,50,55]; // will execute at :15 and :45 every hour
    Schedule.scheduleJob(scheduleRule, pushUpdates);
}

vectorWatch.createServer(scheduleJob);