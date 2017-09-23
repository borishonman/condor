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

var mysql = require('mysql');
var config = require('../config/config');
var MM = require('./mattermost');

var con;

//this object is passed into the callback for each database method
var DBResult = {
     success: {success: true},
     fail: function(errmsg){return {success: false,msg: errmsg};}
};

module.exports = {
     connect: function(callback)
     {
          if (config["database"]["connector"] == "mysql")
          {
               con = mysql.createConnection({
                    host: config["database"]["host"],
                    database: config["database"]["database"],
                    user: config["database"]["user"],
                    password: config["database"]["password"]
               });
               con.connect(function(err) {
                    callback(err);
               });
          }
          else if (config["database"]["connector"] == "postgresql")
          {
               callback("Postgres not yet implemented");
          }
     },
     userIsOwner: function(userid,project,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE id='"+project+"' AND creator='"+userid+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code),null);
                    return;
               }
               callback(DBResult.success,(result.length > 0));
          });
     },
     userIsProjectManager: function(userid,project,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE userid='"+userid+"' AND project='"+project+"' AND role='Project Manager'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code),null);
                    return;
               }
               callback(DBResult.success,(result.length > 0));
          });
     },
     userIsMember: function(userid,project,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE userid='"+userid+"' AND project='"+project+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code),null);
                    return;
               }
               callback(DBResult.success,(result.length > 0));
          });
     },
     userCanCreateProjects: function(user,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"permissions WHERE userid='"+user+"'",function(err,result) {
               if (err)
               { //deny the permission if an error occurred
                    callback(DBResult.fail(err.code),false);
                    return;
               }
               if (result.length == 0)
               { //deny the permission if user was not found in permissions table
                    callback(DBResult.success,false);
                    return;
               }
               callback(DBResult.success,result[0].cancreateprojects);
          });
     },
     toggleCreateProject: function(user,callback)
     {
          //first, make sure there is an entry in the table
          con.query("SELECT cancreateprojects FROM "+config["database"]["prefix"]+"permissions WHERE userid='"+user+"'",function(err,result) {
               if (result.length == 0)
               { //no entry, so add one
                    con.query("INSERT INTO "+config["database"]["prefix"]+"permissions (userid,cancreateprojects) VALUES ('"+user+"',true)",function(err,result) {
                         if (err)
                         { //deny the permission if an error occurred
                              callback(DBResult.fail(err.code),false);
                              return;
                         }
                         if (result.affectedRows > 0)
                         {
                              callback(DBResult.success,true);
                         }
                    });
                    return;
               }
               //otherwise toggle the thing
               con.query("UPDATE "+config["database"]["prefix"]+"permissions SET cancreateprojects = !cancreateprojects WHERE userid='"+user+"'",function(err,result) {
                    if (err)
                    { //deny the permission if an error occurred
                         callback(DBResult.fail(err.code),false);
                         return;
                    }
                    if (result.affectedRows > 0)
                    {
                         con.query("SELECT cancreateprojects FROM "+config["database"]["prefix"]+"permissions WHERE userid='"+user+"'",function(err,result) {
                              callback(DBResult.success,result[0].cancreateprojects);
                         });
                    }
                    else
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"),false);
                    }
               });
          });
     },
     getAllMembers: function(callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"permissions",function(err,result) {
               if (err)
               { //deny the permission if an error occurred
                    callback(DBResult.fail(err.code),[]);
                    return;
               }
               var members = [];
               for (row in result)
               {
                    members.push({"userid": result[row].userid, "cancreateprojects": result[row].cancreateprojects});
               }
               callback(DBResult.success,members);
          });
     },
     userAssignedTask: function(project,task,user,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"' AND assigned='"+user+"'",function(err,result) {
               if (err)
               { //deny the permission if an error occurred
                    callback(DBResult.fail(err.code),false);
                    return;
               }
               if (result.length > 0)
               {
                    callback(DBResult.success,true);
               }
               else
               {
                    callback(DBResult.success,false);
               }
          });
     },
     addMember: function(userid,role,project,callback)
     {
          if (config["database"]["connector"] == "mysql")
          {
               //make sure the project exists
               con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE id='"+project+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.length == 0)
                    {
                         callback(DBResult.fail("Project does not exist"));
                         return;
                    }
                    //make sure the member hasn't already been assigned to this project
                    con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
                         if (err)
                         {
                              callback(DBResult.fail(err.code));
                              return;
                         }
                         if (result.length > 0)
                         {
                              callback(DBResult.fail(userid+" is already assigned to this project"));
                              return;
                         }
                         //create the member assignment
                         con.query("INSERT INTO "+config["database"]["prefix"]+"member_assignments (userid,project,role) VALUES ('"+userid+"','"+project+"','"+role+"')",function(err,result) {
                              if (err)
                              {
                                   callback(DBResult.fail(err.code));
                                   return;
                              }
                              //make sure something was changed
                              if (result.affectedRows == 0)
                              {
                                   callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                                   return;
                              }
                              callback(DBResult.success);
                         });
                    });
               });
          }
          else if (config["database"]["connector"] == "postgresql")
          {
               callback(DBResult.fail("Postgres not yet implemented"));
          }
     },
     deleteMember: function(userid,project,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Member is not assigned to this project"));
                    return;
               }
               con.query("DELETE FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    //make sure something was changed
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     promoteMember: function(userid,project,callback)
     {
          //make sure the member assignment exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Member assignment does not exist"));
                    return;
               }
               //set the new role
               con.query("UPDATE "+config["database"]["prefix"]+"member_assignments SET role='Project Manager' WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    //make sure something was changed
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     demoteMember: function(userid,project,callback)
     {
          //make sure the member assignment exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Member assignment does not exist"));
                    return;
               }
               //set the new role
               con.query("UPDATE "+config["database"]["prefix"]+"member_assignments SET role='Member' WHERE project='"+project+"' AND userid='"+userid+"'", function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    //make sure something was changed
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },

     createProject: function(project,desc,creator,callback)
     {
          if (config["database"]["connector"] == "mysql")
          {
               //TODO: Mattermost user check
               con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE title='"+project+"'", function(err, result) {
                    if (result.length > 0)
                    { //fail if the project already exists
                         callback(DBResult.fail("Project already exists"));
                         return;
                    }
                    con.query("INSERT INTO "+config["database"]["prefix"]+"projects (id,title,creator,create_time,description) VALUES ('"+project.replace(/ /g,'_').toLowerCase()+"','"+project+"','"+creator+"',FROM_UNIXTIME("+Math.floor(Date.now() / 1000)+"),'"+desc+"')",function(err,result) {
                         if (err)
                         {
                              callback(DBResult.fail(err.code));
                         }
                         else
                         {
                              //make sure something was changed
                              if (result.affectedRows > 0)
                              {
                                   //add the creator as a project manager
                                   module.exports.addMember(creator,"Project Manager",project.replace(/ /g,'_').toLowerCase(),function (res) {
                                        if (!res.success)
                                        {
                                             callback(DBResult.fail(res.msg));
                                        }
                                        else
                                        {
                                             callback(DBResult.success);
                                        }
                                   });
                              }
                              else
                                   callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         }
                    });
               });
          }
          else if (config["database"]["connector"] == "postgresql")
          {
               callback(DBResult.fail("Postgres not yet implemented"));
          }
     },
     deleteProject: function(project,callback)
     {
          if (config["database"]["connector"] == "mysql")
          {
               con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE id='"+project.replace(/ /g,'_').toLowerCase()+"'", function(err, result) {
                    if (result.length == 0)
                    { //fail if the project doesn't exist
                         callback(DBResult.fail("Project "+project.replace(/ /g,'_').toLowerCase()+" does not exist"));
                         return;
                    }
                    con.query("DELETE FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project.replace(/ /g,'_').toLowerCase()+"'",function(err,result) {
                         if (err)
                         {
                              callback(DBResult.fail(err.code));
                              return;
                         }
                         //make sure changes were made
                         if (result.affectedRows == 0)
                         {
                              callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                              return;
                         }
                         con.query("DELETE FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project.replace(/ /g,'_').toLowerCase()+"'",function(err,result) {
                              if (err)
                              {
                                   callback(DBResult.fail(err.code));
                                   return;
                              }
                              con.query("DELETE FROM "+config["database"]["prefix"]+"projects WHERE id='"+project.replace(/ /g,'_').toLowerCase()+"'",function(err,result) {
                                   if (err)
                                   {
                                        callback(DBResult.fail(err.code));
                                        return;
                                   }
                                   //make sure changes were made
                                   if (result.affectedRows == 0)
                                   {
                                        callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                                        return;
                                   }
                                   callback(DBResult.success);
                              });
                         });
                    });
               });
          }
          else if (config["database"]["connector"] == "postgresql")
          {
               callback(DBResult.fail("Postgres not yet implemented"));
          }
     },
     createTask: function(project,name,due,desc,callback)
     {
          //make sure the project exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE id='"+project.replace(/ /g,'_').toLowerCase()+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Project does not exist!"));
                    return;
               }
               //do not allow duplicate task names
               con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+name+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.length > 0)
                    {
                         callback(DBResult.fail("Task already exists"));
                         return;
                    }
                    //insert the new task into the database
                    con.query("INSERT INTO "+config["database"]["prefix"]+"tasks (project,task,assigned,status,due,description,created) VALUES ('"+project+"','"+name+"','','No Work Done',FROM_UNIXTIME("+due+"),'"+desc+"',FROM_UNIXTIME("+Math.floor(Date.now() / 1000)+"))",function(err,result) {
                         if (err)
                         {
                              callback(DBResult.fail(err.code));
                              return;
                         }
                         if (result.affectedRows == 0)
                         {
                              callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                              return;
                         }
                         callback(DBResult.success);
                    });
               });
          });
     },
     deleteTask: function(project,task,callback)
     {
          //make sure the task exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Task does not exist"));
                    return;
               }
               con.query("DELETE FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     changeTaskStatus: function(project,task,status,callback)
     {
          //make sure the task exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Task does not exist"));
                    return;
               }
               //run the query to update the task
               con.query("UPDATE "+config["database"]["prefix"]+"tasks SET status='"+status+"'", function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     assignTask: function(project,task,member,callback)
     {
          //make sure the task exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Task does not exist"));
                    return;
               }
               //update the assigned member id in the database
               con.query("UPDATE "+config["database"]["prefix"]+"tasks SET assigned='"+member+"' WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     deassignTask: function(project,task,callback)
     {
          //make sure the task exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Task does not exist"));
                    return;
               }
               //update the assigned member id in the database
               con.query("UPDATE "+config["database"]["prefix"]+"tasks SET assigned='' WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     changeDate: function(project,task,date,callback)
     {
          //make sure the task exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Task does not exist"));
                    return;
               }
               //update the assigned member id in the database
               con.query("UPDATE "+config["database"]["prefix"]+"tasks SET due=FROM_UNIXTIME("+date+") WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },
     changeDesc: function(project,task,desc,callback)
     {
          //make sure the task exists
          con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
               if (err)
               {
                    callback(DBResult.fail(err.code));
                    return;
               }
               if (result.length == 0)
               {
                    callback(DBResult.fail("Task does not exist"));
                    return;
               }
               //update the assigned member id in the database
               con.query("UPDATE "+config["database"]["prefix"]+"tasks SET description='"+desc+"' WHERE project='"+project+"' AND task='"+task+"'",function(err,result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code));
                         return;
                    }
                    if (result.affectedRows == 0)
                    {
                         callback(DBResult.fail("No database rows were affected. Database was not changed for some reason"));
                         return;
                    }
                    callback(DBResult.success);
               });
          });
     },

     getAllProjects: function(callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"projects", function(err, result) {
               if (err)
               {
                    callback(DBResult.fail(err.code),null);
               }
               else
               {
                    var projects = {};
                    for (row in result)
                    { //parse each returned row from the database
                         projects[result[row].title.replace(/ /g,"_").toLowerCase()] = {
                              'title': result[row].title,
                              'description': result[row].description,
                              'creator': result[row].creator,
                              'members': [], //this will be filled by the caller
                              'tasks': [], //this will be filled by the caller
                              'mytasks': [], //this will be filled by the caller
                              'active': ""
                         };
                    }
                    callback(DBResult.success,projects);
               }
          });
     },
     getProjectMembers: function(project,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE id='"+project+"'", function(err, result) {
               if (err)
               {
                    callback(DBResult.fail(err.code),null);
                    return;
               }
               if (result.length == 0)
               { //fail if the project doesn't exist
                    callback(DBResult.fail("Project does not exist"));
                    return;
               }
               con.query("SELECT * FROM "+config["database"]["prefix"]+"member_assignments WHERE project='"+project+"'", function(err, result) {
                    if (err)
                    {
                         callback(DBResult.fail(err.code),null);
                         return;
                    }
                    var members = {};
                    for (row in result)
                    { //parse each returned row from the database
                         members[result[row].userid] = {
                              'username': result[row].userid,
                              'role': result[row].role
                         };
                    }
                    callback(DBResult.success,members);
               });
          });
     },
     getProjectTasks: function(project,callback)
     {
          con.query("SELECT * FROM "+config["database"]["prefix"]+"projects WHERE id='"+project+"'", function(err, result) {
               if (err)
               {
                    callback(DBResult.fail(err.code),null);
                    return;
               }
               if (result.length == 0)
               { //fail if the project doesn't exist
                    callback(DBResult.fail("Project does not exist"));
                    return;
               }
               con.query("SELECT * FROM "+config["database"]["prefix"]+"tasks WHERE project='"+project+"'",function(err,result) {
                    var tasks = [];
                    for (row in result)
                    { //parse each returned row from the database
                         var dueDate = ((result[row].due == null) ? new Date(0) : result[row].due);
                         var dueFormat = dueDate.getMonth()+1 + "-" + dueDate.getDate() + "-"+ dueDate.getFullYear();
                         if (dueDate < Date.now() && result[row].status != "Done")
                         {
                              dueFormat += "\nOVERDUE!";
                         }
                         tasks[row] = {
                              'name': result[row].task,
                              'assigned': result[row].assigned,
                              'status': result[row].status,
                              'due': dueFormat,
                              'description': result[row].description
                         };
                    }
                    callback(DBResult.success,tasks);
               });
          });
     }
};
