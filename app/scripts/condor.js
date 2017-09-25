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

function completeLogin(user)
{
     Condor.queryProject({"function": "getprojectlist"},function(res) {
          //set the username and team
          Condor.queryAuth({"function": "getteam", "token": getCookie("token")},function(res) {
               document.getElementById('user-id').innerHTML = user;
               document.getElementById('user-team').innerHTML = res.team;
               //display the logout button
               document.getElementById('logout').className = "";
               //set the page title
               document.title = "Condor | "+res.team;
          });

          if (res.result != "success")
          {
               window.alert("Failed to get project list:\n\n"+res.msg);
               return;
          }
          //parse the URL and select a project to load
          var url = window.location.pathname;
          var selectedProject = "";
          var r = /\/(project)\/([^\?]*)\??/g;
          var m = r.exec(url);
          if (m)
          {
               selectedProject = m[2];
          }
          var match = false;
          //display the projects list title header
          document.getElementById('projects-title').className = "";
          //build the list of projects in the sidebar
          for (p in res.projs)
          {
               var newRow = document.createElement('li');
               newRow.addEventListener('click',changeProject);
               newRow.innerHTML = res.projs[p].title;
               if (res.projs[p].title.replace(/ /g,"_").toLowerCase() == selectedProject)
               {
                    newRow.className = "sidebar-item-active clickable project";
                    changeProject({target: newRow});
                    match = true;
               }
               else
               {
                    newRow.className = "sidebar-item clickable project";
               }
               document.getElementById('projects').getElementsByTagName('ul')[0].appendChild(newRow);
          }
          if (selectedProject != "" && !match)
          { //if no match was found but a project was requested in the URL, make the page display a 404
               changeProject(null);
          }
          else if (selectedProject == "")
          { //if no project was selected display the home page
               Condor.GetHome(function(res) {
                    document.getElementById('content').innerHTML = res;
               });
          }
          //check if the user can create projects
          Condor.queryPermission({"permission": "createproject"},function(res) {
               if (res.haspermission) document.getElementById('projects-create').className = "clickable";
          });
          //check if the user can toggle member permissions
          Condor.queryPermission({"permission": "cantogglecreateproject"},function(res) {
               if (res.haspermission) document.getElementById('togglemember').className = "clickable";
          });
     });
}
function displayLoginForm()
{
     //clear project buttons in sidebar
     var projects = document.getElementById('projects').getElementsByTagName('li');
     for (var p=0;p<projects.length;p++)
     {
          projects[p].parentNode.removeChild(projects[p]);
     }
     //hide project create and delete button
     document.getElementById('projects-create').className = "nodisplay clickable";
     document.getElementById('projects-delete').className = "nodisplay clickable";
     //clear team name and user id fields
     document.getElementById('user-team').innerHTML = "Condor";
     document.getElementById('user-id').innerHTML = "Task Management Engine";
     //hide logout button
     document.getElementById('logout').className = "nodisplay";
     //hide projects title
     document.getElementById('projects-title').className = "nodisplay";
     //set the page title
     document.title = "Condor | Login";

     Condor.GetLogin(function(res) {
          document.getElementById('content').innerHTML = res;
          document.getElementById("txt_password").addEventListener("keyup", function(event) {
               event.preventDefault();
               if (event.keyCode == 13) {
                    document.getElementById("btn_login").click();
               }
          });
     });
}
function login()
{
     var username = document.getElementById('txt_username').value;
     var password = document.getElementById('txt_password').value;
     Condor.queryAuth({"function": "login", "username": username, "password": password},function(res) {
          if (res.token == null || res.token == undefined)
          {
               window.alert("Invalid credentials");
               return;
          }

          setCookie("token",res.token,20);
          document.getElementById('content').innerHTML = "";
          completeLogin(res.username);
     });
}
function logout()
{
     var prompt = window.confirm("Are you sure you want to log out?");
     if (!prompt)
     {
          return;
     }
     Condor.queryAuth({"function": "logout", "token": getCookie("token")},function(res) {
          if (!res.result)
          {
               window.alert("Something happened, could not logout:\n\n"+res.msg);
               return;
          }
          setCookie("token","",-1);
          //display login form in content pane - its login button will call login()
          displayLoginForm();
     });
}

function main()
{
     //log in to mattermost
     //try to log in with token from cookie, if fail prompt for a login page
     var token = getCookie("token");
     Condor.queryAuth({"function": "restorelogin", "token": token},function(res) {
          if (res.username != null && res.username != undefined)
          { //token was valid, complete the login and display the page
               completeLogin(res.username);
          }
          else
          { //token was not valid, display the login form
               //but first, delete the cookie with the invalid token
               setCookie("token","",-1);
               //display login form in content pane - its login button will call login()
               displayLoginForm();
          }
     });
}

function openMembersWindow()
{
     window.open(window.location.protocol+"//"+window.location.hostname+"/members/"+getCookie("token"));
}

window.onload = main;
