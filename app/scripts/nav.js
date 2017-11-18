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

var changeProject = function(event)
{
     if (event == null)
     {
          document.getElementById('content').innerHTML = "<div id='noproject'>404: project not found</div>";
          document.title = "Condor | Project not Found";
          return;
     }

     var sender = event.target || event.srcElement;

     Condor.GetProject(sender.innerHTML.replace(/ /g,'_').toLowerCase(),function(res) {
          //set the active project in the sidebar
          var old = document.getElementsByClassName('sidebar-item-active')[0];
          if (old != undefined)
               old.className = old.className.replace('sidebar-item-active','sidebar-item');
          sender.className = sender.className.replace('sidebar-item','sidebar-item-active');
          //display the project page content
          document.getElementById('content').innerHTML = res;
          //set the page title
          document.title = "Condor | "+sender.innerHTML;
          //add the project URL to the browser's history
          history.pushState('data to be passed', "Condor | "+sender.innerHTML, "/project/"+sender.innerHTML.replace(/ /g,'_').toLowerCase());
          //update the page stuff
          updateTaskList();
          updateMyTaskList();
          updateAssignedTaskCounter();
          //check for delete permission
          Condor.queryPermission({"permission": "deleteproject", "project": sender.innerHTML.replace(/ /g,'_').toLowerCase()},function(res) {
               if (res.haspermission)
               {
                    document.getElementById('projects-delete').className = document.getElementById('projects-delete').className.replace("nodisplay","");
                    document.getElementById('project-description-edit').className = "";
               }
               //check member management permission
               Condor.queryPermission({"permission": "managemembers", "project": sender.innerHTML.replace(/ /g,'_').toLowerCase()},function(res) {
                    if (res.haspermission) document.getElementById('project-members-buttons').className = "";
                    //check task management permission
                    Condor.queryPermission({"permission": "managetasks", "project": sender.innerHTML.replace(/ /g,'_').toLowerCase()},function(res) {
                         if (res.haspermission) document.getElementById('project-all-tasks-btns').className = "";
                    });
               });
          });
     });
}
