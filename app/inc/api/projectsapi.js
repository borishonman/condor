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

//convert database result to a JSON object to be sent as the response to the API call
var checkResult = function(res) {
     if (res.success) return {result: "success"};
     else return {result: "fail", msg: res.msg};
}

//handlers for each supported member API call
var handlers = {
     "getprojectlist": function(query,callback) {
          module.exports.getAllProjects(function(projs) {
               var res = {};
               DB.getIsModerator(MM.getAuthUser(query["token"]), function(result,mod) {
                    if (mod || MM.getIsUserAdmin())
                         res = projs;
                    else {
                         for (p in projs)
                         {
                              if (MM.getAuthUser(query["token"]) in projs[p]["members"])
                                   res[p] = projs[p];
                         }
                    }
                    callback({result: "success", projs: res});
               });
          });
     },
     "create": function(query,callback) {
          if (!MM.userExists(query["member"],query["token"]))
          {
               callback({result: "fail", msg: "User '"+query["member"]+"' does not exist"});
               return;
          }
          DB.createProject(query["project"],query["description"],query["member"],function(res) {callback(checkResult(res));});
     },
     "delete": function(query,callback) {
          DB.deleteProject(query["project"],function(res) {callback(checkResult(res));});
     },
     "status": function(query,callback) {
          DB.changeTaskStatus(query["project"],query["task"],query["status"],function(res) {callback(checkResult(res));});
     },
     "createtask": function(query,callback) {
          DB.createTask(query["project"],query["name"],query["due"],query["desc"],function(res){callback(checkResult(res));});
     },
     "deletetask": function(query,callback) {
          DB.deleteTask(query["project"],query["name"],function(res){callback(checkResult(res));});
     },
     "assign": function(query,callback) {
          if (!MM.userExists(query["member"],query["token"]))
          {
               callback({result: "fail", msg: "User '"+query["member"]+"' does not exist"});
               return;
          }
          DB.assignTask(query["project"],query["task"],query["member"],function(res) {callback(checkResult(res));});
     },
     "deassign": function(query,callback) {
          DB.deassignTask(query["project"],query["task"],function(res) {callback(checkResult(res));});
     },
     "editdate": function(query,callback) {
          DB.changeDate(query["project"],query["task"],query["date"],function(res) {callback(checkResult(res));});
     },
     "editdesc": function(query,callback) {
          DB.changeDesc(query["project"],query["task"],query["desc"],function(res) {callback(checkResult(res));});
     }
};

var data = {
     getAllProjects: function(callback)
     {
          DB.getAllProjects(function(err, projects) {
               if (Object.keys(projects).length == 0)
               {
                    callback({});
                    return;
               }
               var cnt = 0;
               for (p in projects)
               {
                    DB.getProjectMembers(p,function(err,members) {
                         projects[this[1]]["members"] = members;
                         DB.getProjectTasks(this[1],function(err,tasks) {
                              projects[this[1]]["tasks"] = tasks;
                              if (this[0] == Object.keys(projects).length-1)
                              {
                                   callback(projects);
                              }
                         }.bind(this));
                    }.bind([cnt,p]));
                    cnt++;
               }
          });
     },
     processAPICall: function(query,callback)
     {
          if (query["function"] in handlers) {
               permsmod.getPermission({"permission": query["function"],"project": query["project"],"task": query["task"],"token": query["token"]},function(res) {
                    if (!res.haspermission)
                    {
                         callback({result: "fail", msg: "You do not have the permission to do that!"});
                         return;
                    }
                    handlers[query["function"]](query,function(res) {callback(res);});
               });
          }
          else {
               callback({result: "fail", msg: "Command '"+query["function"]+"' invalid"});
          }
     }
};

module.exports = data;
