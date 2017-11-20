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

var srv = require('./inc/server');
var t = require('./inc/templates');
var url = require('url');
var projectsmod = require('./inc/api/projectsapi');
var permsmod = require('./inc/api/permissionsapi');
var DB = require('./inc/database');
var MM = require('./inc/mattermost');
var notifier = require('./inc/notifier');
var appdeploy = require('./inc/appdeploy');

//this function will handle all of the requests
var handleRequest = function(res, req, callback)
{
     var content = "";

     var r = /\/(app)\/([^\?]*)\??/g;
     var m = r.exec(req.url);
     if (m)
     {
          var apprequest = appdeploy.handleRequest(req);
          callback(apprequest.data, apprequest.type);
          return;
     }

     //handle requests for project pages
     var r = /\/(getproject)\/([^\?]*)\??/g;
     var m = r.exec(req.url);
     if (m)
     {
          projectsmod.getAllProjects(function(projs) {
               permsmod.getPermission({"permission": "viewproject", "project": m[2].toLowerCase(), "token": req.body.token},function(res) {
                    if (!res.haspermission)
                    {
                         callback("<div id='noproject'>You do not have permission to view this project</div>");
                         return;
                    }
                    //we are only rendering the project part, not the whole page
                    if (m[2].toLowerCase() in projs) callback(t.getHTML("project",projs[m[2].toLowerCase()],req.headers['user-agent']));
                    else callback("<div id='noproject'>404: project not found</div>");
               });
          });
          return;
     }

     //handle requests for member list page
     var r = /\/(members)\/([^\?]*)\??/g;
     var m = r.exec(req.url);
     if (m)
     {
          permsmod.getPermission({"permission": "cantogglecreateproject", "token": m[2]},function(res) {
               if (!res.haspermission)
               {
                    callback("<div id='noproject'>You do not have permission to view the members permission table</div>");
                    return;
               }
               var members = DB.getAllMembers(function(res,members) {
                    var data = {
                         "stylesheets": ["main.css","project.css"],
                         "scripts": ["condor-api.js","cookie.js","members.js"],
                         "members": members
                    };
                    callback(t.getHTML("members",data,req.headers['user-agent']));
               });
          });
          return;
     }

     //handle requests for login page
     var r = /\/(login)\/([^\?]*)\??/g;
     var m = r.exec(req.url);
     if (m)
     {
          callback(t.getHTML("login",null,req.headers['user-agent']));
          return;
     }

     //handle requests for home page
     var r = /\/(home)\/([^\?]*)\??/g;
     var m = r.exec(req.url);
     if (m)
     {
          callback(t.getHTML("home",null,req.headers['user-agent']));
          return;
     }

     //fill the template data block and render the page
     var data = {
          "stylesheets": ["main.css","project.css","login.css","home.css"],
          "scripts": ["jquery-3.2.1.js","cookie.js","condor-api.js","condor.js","nav.js","project.js"],
          "projects-title": "PROJECTS",
          "pagecontent": content
     }
     callback(t.getHTML("main", data, req.headers['user-agent']));
}

//on launch, initialize the DB library first
DB.setup();
projectsmod.getAllProjects(function(projs) {
     notifier.initialize(); //initialize the notifier
     t.load(); //load and compile all of the templates
     srv.start(handleRequest); //now we can start the server
});
