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

var MM = require('../mattermost');

var handlers = {
     "login": function(query,callback)
     {
          var res = MM.login(query["username"],query["password"]);
          callback({result: "success", token: res.token, username: res.username});
     },
     "logout": function(query,callback)
     {
          var res = MM.logout(query["token"]);
          callback({result: res.success, msg: res.msg});
     },
     "restorelogin": function(query,callback)
     {
          var res = MM.restorelogin(query["token"]);
          callback({result: "success", token: res.token, username: res.username});
     },
     "getteam": function(query,callback)
     {
          var res = MM.getTeam(query["token"]);
          callback({result: "success", team: res.team});
     }
};

var methods = {
     processAPICall: function(query,callback)
     {
          if (query["function"] in handlers) {
               //execute the function
               handlers[query["function"]](query,function(res) {callback(res);});
          }
          else {
               callback({result: "fail", msg: "Command '"+query["function"]+"' invalid"});
          }
     }
};

module.exports = methods;
