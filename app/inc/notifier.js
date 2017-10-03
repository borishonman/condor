/*
This file is part of Condor.

Condor is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Condor is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/

var config = require('../config/config.json');
var prefs = require('../config/prefs.json');
var fs = require('fs');
var MM = require('./mattermost');

var myToken = "";

var methods = {
     initialize: function() {
          if (config["notifications"]["disableall"])
               return;
          var token = prefs["mattermost"]["token"];
          var res = MM.restorelogin(token);
          if (res.username == undefined)
          { //token was not valid
               //log in and save the new token
               res = MM.login(config["mattermost"]["user"], config["mattermost"]["pass"]);
               if (res.token == null)
               {
                    console.error("[ERROR]\t\tNotifier could not log in to MM. Notification messages will be disabled");
                    return;
               }
               //save the new token back to the prefs file
               var newPrefs = prefs;
               token = res.token;
               newPrefs["mattermost"]["token"] = res.token;
               fs.writeFile('app/config/prefs.json', JSON.stringify(newPrefs), 'utf8', function(err,data) {
                    if (err)
                    {
                         console.error("[ERROR]\t\tNotifier could not write new MM token: "+err);
                         return;
                    }
               });
          }
          myToken = token;
          console.log("[INFO]\t\tNotifier successfully authenticated with MM. Notification messages will be sent")
     },
     addedToProject: function(user,project) {
          if (config["notifications"]["disableall"] || !config["notifications"]["useraddedtoproject"])
               return;
          var message = "[NOTIFY] You have been added to the project \"**"+project+"**\". View it here: "+config["server"]["host"]+"/project/"+project.replace(/ /g, "_").toLowerCase();
          return MM.sendMessage(config["mattermost"]["user"],user,message,myToken);
     },
     assignedTask: function(user,taskName,due,project) {
          if (config["notifications"]["disableall"] || !config["notifications"]["userassignedtask"])
               return;
          var dueDate = new Date(due*1000);
          var dueDateString = dueDate.getMonth()+1 + "/" + dueDate.getDate() + "/" + dueDate.getFullYear();
          var message = "[NOTIFY] You have been assigned \"**"+taskName+"**\" in the project \"**"+project+"**\". This task is due on "+dueDateString+". More information: "+config["server"]["host"]+"/project/"+project.replace(/ /g, "_").toLowerCase();
          return MM.sendMessage(config["mattermost"]["user"],user,message,myToken);
     },
     dueDateChanged: function(user,taskName,due,project)
     {
          if (config["notifications"]["disableall"] || !config["notifications"]["taskduedatechanged"])
               return;
          var dueDate = new Date(due*1000);
          var dueDateString = dueDate.getMonth()+1 + "/" + dueDate.getDate() + "/" + dueDate.getFullYear();
          var message = "[NOTIFY] Your assigned task \"**"+taskName+"**\" in the project \"**"+project+"**\" has had a change in due date. This task is now due on "+dueDateString+". More information: "+config["server"]["host"]+"/project/"+project.replace(/ /g, "_").toLowerCase();
          return MM.sendMessage(config["mattermost"]["user"],user,message,myToken);
     },
     descChanged: function(user,taskName,desc,project)
     {
          if (config["notifications"]["disableall"] || !config["notifications"]["taskdescchanged"])
               return;
          var message = "[NOTIFY] Your assigned task \"**"+taskName+"**\" in the project \"**"+project+"**\" has had a change in description. More information: "+config["server"]["host"]+"/project/"+project.replace(/ /g, "_").toLowerCase();
          return MM.sendMessage(config["mattermost"]["user"],user,message,myToken);
     }
};
module.exports = methods;
