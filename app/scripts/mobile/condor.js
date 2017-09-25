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

function toggleSidebar()
{
     if ($('#sidebar').css('display') == 'none')
     { //show the sidebar
          $('#boigah').css('background-image',"url('/images/close.svg')");
          $('#sidebar').show(500);
     }
     else if ($('#content').html().trim() != "")
     { //hide the sidebar
          $('#boigah').css('background-image',"url('/images/boigah.svg')");
          $('#sidebar').hide(500);
     }
}
function displayLoginForm()
{
     //clear project buttons in sidebar
     var projects = document.getElementById('projects').getElementsByTagName('li');
     for (var p=0;p<projects.length;p++)
     {
          projects[p].parentNode.removeChild(projects[p]);
     }
     //clear the project html
     $('#content').html('');
     //hide project create and delete button
     $('#projects-create').hide();
     $('#projects-delete').hide();
     //clear team name and user id fields
     $('#user-team').html("Condor");
     $('#user-id').html("Task Management Engine");
     //hide logout button
     $('#logout').hide();
     //hide projects title
     $('#projects-title').hide();
     //set the page title
     document.title = "Condor | Login";
     //set the login form containing table to the remaining height of the screen
     var h = window.innerHeight - parseInt($('#user-info').css('height')) - 54 - 54;
     $('#login-table').height(h);
     //get the login form HTML
     Condor.GetLogin(function(res) {
          $('#login-div').html(res);
          //scale the login form
          $('#login-page').css('font-size',window.innerWidth*0.1);
          $('#login-header').css('margin-left',-parseInt($('#sidebar').css('padding-left')));
          $('#login-header').css('margin-right',-parseInt($('#sidebar').css('padding-right')));
          var w = window.innerWidth-200*2;
          var h = w / 6;
          var b = h / 8;
          var tw = window.innerWidth*0.05;
          $('#txt_username').css('width',w);
          $('#txt_username').css('height',h);
          $('#txt_password').css('width',w);
          $('#txt_password').css('height',h);
          $('#txt_username').css('border', b+"px solid #4AA39B");
          $('#txt_password').css('border', b+"px solid #4AA39B");
          $('#txt_username').css('font-size', tw);
          $('#txt_password').css('font-size', tw);
          $('#lbl_username').css('font-size', tw);
          $('#lbl_password').css('font-size', tw);
          $('#btn_login').css('font-size', tw);
          $('#btn_login').css('padding', (tw/2)+"px "+tw+"px");
          WAIT_HideWait();
          //show the login form
          $('#login-table').show();
          document.getElementById("txt_password").addEventListener("keyup", function(event) {
               event.preventDefault();
               if (event.keyCode == 13) {
                    document.getElementById("btn_login").click();
               }
          });
     });
}
function completeLogin(user)
{
     Condor.queryProject({"function": "getprojectlist"},function(res) {
          //set the username and team
          Condor.queryAuth({"function": "getteam", "token": getCookie("token")},function(res) {
               $('#user-id').html(user);
               $('#user-team').html(res.team);
               //display the logout button
               $('#logout').show();
               var fs = parseInt($('#user-id').css('font-size'),10);
               $('#logout').css('font-size', fs);
               $('#logout').css('padding', fs/2 + " " + fs);
               //set the page title
               document.title = "Condor | "+res.team;
               WAIT_HideWait();
          });

          if (res.result != "success")
          {
               window.alert("Failed to get project list:\n\n"+res.msg);
               return;
          }

          //parse the URL and select a project to load if one specified
          var url = window.location.pathname;
          var selectedProject = "";
          var r = /\/(project)\/([^\?]*)\??/g;
          var m = r.exec(url);
          if (m)
          {
               selectedProject = m[2];
          }

          //remove the login form
          document.getElementById('login-div').innerHTML = "";
          $('#login-table').hide();

          //display the projects list title header
          var titleProjSz = parseInt($('#user-team').css('font-size'))/2;
          $('#projects-title').show();
          $('#projects-title').css('font-size', titleProjSz);

          //scale the add/delete project buttons
          $('#projects-create').width(titleProjSz);
          $('#projects-create').height(titleProjSz);
          $('#projects-delete').width(titleProjSz);
          $('#projects-delete').height(titleProjSz);

          //build the list of projects in the sidebar
          var match = false;
          for (p in res.projs)
          {
               var newRow = document.createElement('li');
               newRow.addEventListener('click',changeProject);
               newRow.innerHTML = res.projs[p].title;
               $(newRow).css('font-size', parseInt($('#projects-title').css('font-size'),10)/2);
               $(newRow).css('padding', $(newRow).css('font-size'));
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
          //if no match was found but a project was requested in the URL, make the page display a 404
          if (selectedProject != "" && !match)
          {
               changeProject(null);
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
function login()
{
     var username = document.getElementById('txt_username').value;
     var password = document.getElementById('txt_password').value;

     WAIT_ShowWait();

     Condor.queryAuth({"function": "login", "username": username, "password": password},function(res) {
          if (res.token == null || res.token == undefined)
          {
               window.alert("Invalid credentials");
               return;
          }

          setCookie("token",res.token,20);
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
window.onload = function() {
     var token = getCookie("token");

     WAIT_ShowWait();

     $('#sidebar').css('padding', window.innerWidth*0.05);
     $('#sidebar').width(window.innerWidth-window.innerWidth*0.1);
     $('#sidebar').height(window.innerHeight-window.innerWidth*0.1);

     $('#boigah').css('width',window.innerWidth*0.08);
     $('#boigah').css('height',window.innerWidth*0.08);
     $('#boigah').css('margin',window.innerWidth*0.01)

     var w1 = window.innerWidth * 0.1;
     var w2 = window.innerWidth * 0.05;
     $("#user-team").css("font-size", w1);
     $("#user-id").css("font-size", w1/4);

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
