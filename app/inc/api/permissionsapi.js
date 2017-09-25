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
var config = require('../../config/config.json');

var handlers = {
     "createproject": function(query,callback)
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }

          DB.userCanCreateProjects(user,function(res,create) {
               callback({result: "success", haspermission: create});
          });
     },
     "deleteproject": function(query,callback)
     {
          var user = MM.getAuthUser(query["token"]);
          var project = query["project"];

          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }

          DB.userIsOwner(user,project,function(res,owner) {
               callback({result: "success", haspermission: owner && config["permissions"]["ownerdelete"]});
          });
     },
     "managemembers": function(query,callback)
     {
          var user = MM.getAuthUser(query["token"]);

          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }

          DB.userIsProjectManager(user,query["project"],function(res,manager) {
               callback({result: "success", haspermission: manager});
          });
     },
     "managetasks": function(query,callback)
     {
          var user = MM.getAuthUser(query["token"]);

          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }

          DB.userIsProjectManager(user,query["project"],function(res,manager) {
               callback({result: "success", haspermission: manager});
          });
     },
     "cantogglecreateproject": function(query,callback)
     {
          if (!MM.getIsUserAdmin(query["token"]))
          {
               callback({result: "fail", msg: "You do not have permission to do this!"});
               return;
          }
          callback({result: "success", haspermission: true});
     },
     "togglecreateproject": function(query,callback)
     {
          if (!MM.getIsUserAdmin(query["token"]))
          {
               callback({result: "fail", msg: "You do not have permission to do this!"});
               return;
          }
          var user = query["userid"];
          if (!MM.userExists(user,query["token"]))
          {
               callback({result: "fail", msg: "User '"+user+"' does not exist"});
               return;
          }
          DB.toggleCreateProject(user,function(res,create) {
               if (res.success)
               {
                    callback({result: "success",haspermission: create});
               }
               else
               {
                    callback({result: "fail",msg: res.msg});
               }
          });
     },
     "getprojectlist": function(query,callback)
     {
          //everyone can get the projects list
          callback({result: "success", haspermission: true});
     },
     "viewproject": function(query,callback)
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          //only members of a project can view it
          DB.userIsMember(user,query["project"],function(res,canview) {
               if (res.success)
               {
                    callback({result: "success", haspermission: canview});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "create": function(query,callback) //create project
     {
          handlers["createproject"](query,function(res) {
               callback(res);
          })
     },
     "delete": function(query,callback) //delete project
     {
          handlers["deleteproject"](query,function(res) {
               callback(res);
          })
     },
     "status": function(query,callback) //change task status
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }

          DB.userAssignedTask(query["project"],query["task"],user,function(res,canchange) {
               if (res.success)
               {
                    callback({result: "success", haspermission: canchange});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "createtask": function(query,callback) //create a task
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,cancreate) {
               if (res.success)
               {
                    callback({result: "success", haspermission: cancreate});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "deletetask": function(query,callback) //delete a task
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,candelete) {
               if (res.success)
               {
                    callback({result: "success", haspermission: candelete});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "assign": function(query,callback) //assign a task
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,canassign) {
               if (res.success)
               {
                    callback({result: "success", haspermission: canassign});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "deassign": function(query,callback) //deassign a task
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,candeassign) {
               if (res.success)
               {
                    callback({result: "success", haspermission: candeassign});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "editdate": function(query,callback) //edit a task's due date
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,caneditdate) {
               if (res.success)
               {
                    callback({result: "success", haspermission: caneditdate});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "editdesc": function(query,callback) //edit a task's description
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,caneditdesc) {
               if (res.success)
               {
                    callback({result: "success", haspermission: caneditdesc});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "add": function(query,callback) //add member to a project
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,canadd) {
               if (res.success)
               {
                    callback({result: "success", haspermission: canadd});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "delete": function(query,callback) //delete member from a project
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,candel) {
               if (res.success)
               {
                    callback({result: "success", haspermission: candel});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "promote": function(query,callback) //promote a member to project Manager
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,canprom) {
               if (res.success)
               {
                    callback({result: "success", haspermission: canprom});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     },
     "demote": function(query,callback) //demote a member to member
     {
          var user = MM.getAuthUser(query["token"]);
          if (user.username == null)
          {
               callback({result: "fail", haspermission: false});
               return;
          }
          DB.userIsProjectManager(user,query["project"],function(res,candem) {
               if (res.success)
               {
                    callback({result: "success", haspermission: candem});
               }
               else
               {
                    callback({result: "fail", haspermission: false});
               }
          });
     }
};

var data = {
     getPermission: function(query,callback)
     {
          if (query["permission"] in handlers) {
               if (MM.getIsUserAdmin(query["token"]) && query["permission"] != "togglecreateproject")
               {
                    callback({result: "success", haspermission: true});
                    return;
               }
               //execute the function
               handlers[query["permission"]](query,function(res) {callback(res);});
          }
          else {
               callback({result: "success", haspermission: false});
          }
     }
};

module.exports = data;
