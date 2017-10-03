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

var DB = require('../database');
var MM = require('../mattermost');
var permsmod = require('./permissionsapi');
var notify = require('../notifier');

//convert database result to a JSON object to be sent as the response to the API call
var checkResult = function(res) {
     if (res.success) return {result: "success"};
     else return {result: "fail", msg: res.msg};
}

//handlers for each supported member API call
var handlers = {
     "add": function(query,callback) {
          if (!MM.userExists(query["member"],query["token"]))
          { //make sure the user to add exists in mattermost
               callback({result: "fail", msg: "User '"+query["member"]+"' does not exist"});
               return;
          }
          DB.addMember(query["member"],"Member",query["project"],function(res) {
               if (res.success)
               {
                    DB.projectName(query["project"],function(res,title) {
                         notify.addedToProject(query["member"],title);
                    });
               }
               callback(checkResult(res));
          });
     },
     "delete": function(query,callback) {
          if (query["member"] == MM.getAuthUser(query["token"]))
          { //do not allow users to delete themselves
               callback({result: "fail", msg: "Cannot remove yourself from a project!"});
               return;
          }
          DB.deleteMember(query["member"],query["project"],function(res){callback(checkResult(res));});
     },
     "promote": function(query,callback) {
          DB.promoteMember(query["member"],query["project"],function(res){callback(checkResult(res));});
     },
     "demote": function(query,callback) {
          if (query["member"] == MM.getAuthUser(query["token"]))
          { //do not allow users to demote themselves
               callback({result: "fail", msg: "Cannot demote yourself!"});
               return;
          }
          DB.demoteMember(query["member"],query["project"],function(res){callback(checkResult(res));});
     }
};

var data = {
     processAPICall: function(query,callback)
     {
          if (query["function"] in handlers) {
               //check permissions
               permsmod.getPermission({"permission": query["function"], "project": query["project"], "token": query["token"]},function(res) {
                    if (!res.haspermission)
                    {
                         callback({result: "fail", msg: "You do not have the permission to do that!"});
                         return;
                    }
                    //execute the function
                    handlers[query["function"]](query,function(res) {callback(res);});
               });
          }
          else {
               callback({result: "fail", msg: "Command '"+query["function"]+"' invalid"});
          }
     }
};

module.exports = data;
