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

var taskSelected;
var myTaskSelected;

function getSelectedMemberRow()
{
     return document.getElementById('project-members').getElementsByClassName('regrow-active')[0];
}
function getSelectedMyTaskRow()
{
     return document.getElementById('project-your-tasks').getElementsByClassName('regrow-active')[0];
}
function getSelectedTaskRow()
{
     return document.getElementById('project-all-tasks').getElementsByClassName('regrow-active')[0];
}
function getCurrentProjectTitle()
{
     return document.getElementById("project-title").getElementsByTagName('td')[0].innerHTML;
}
function getCurrentProject()
{
     return document.getElementById("project-title").getElementsByTagName('td')[0].innerHTML.replace(/ /g,'_').toLowerCase();
}
function getCurrentUser()
{
     return document.getElementById('user-id').innerHTML;
}

var createProject = function()
{
     var projectToCreate = window.prompt("Project Name:","A Project");
     if (projectToCreate == null) return;
     var description = window.prompt("Project Description","");
     if (description == null) return;

     Condor.queryProject({"function": "create", "project": projectToCreate, "description": description, "member": getCurrentUser()},function(response) {
          if (response.result == "success")
          {
               var newProject = document.createElement('li');
               $(newProject).css('font-size', parseInt($('#projects-title').css('font-size'),10)/2);
               $(newProject).css('padding', $(newProject).css('font-size'));
               newProject.innerHTML = projectToCreate;
               newProject.addEventListener('click',changeProject);
               document.getElementById('projects').getElementsByTagName('ul')[0].appendChild(newProject);
          }
          else
          {
               window.alert("Failed to create project:\n\n"+response.msg);
          }
     });
}
var deleteProject = function()
{
     Condor.queryProject({"function": "delete", "project": getCurrentProject()},function(response) {
          if (response.result == "success")
          {
               var projects = document.getElementById('projects').getElementsByTagName('li');
               for (p in projects)
               {
                    if (projects[p].innerHTML == getCurrentProjectTitle())
                         projects[p].parentNode.removeChild(projects[p]);
               }
               document.getElementById("content").innerHTML = "";
               document.getElementById('projects-delete').className = "nodisplay clickable";
               history.pushState('data to be passed', "Home | Condor", "/");

          }
          else
          {
               window.alert("Failed to delete project:\n\n"+response.msg);
          }
     });
}

var changeMember = function(sender)
{
     var old = document.getElementById('project-members').getElementsByClassName('regrow-active')[0];
     if (old != undefined)
          old.className = old.className.replace('regrow-active','regrow');
     sender.className = sender.className.replace('regrow','regrow-active');

     var delBtn = document.getElementById('project-members-buttons').getElementsByTagName('p')[1];
     var promdemBtn = document.getElementById('project-members-buttons').getElementsByTagName('p')[2];

     delBtn.className = delBtn.className.replace('disabled','');
     promdemBtn.className = promdemBtn.className.replace('disabled','');
     if (getSelectedMemberRow().getElementsByTagName('td')[1].innerHTML == "Project Manager")
     {
          promdemBtn.innerHTML = "Demote to Member";
     }
     else
     {
          promdemBtn.innerHTML = "Promote to Project Manager";
     }

     if (getSelectedTaskRow() != undefined)
     {
          var assdeassBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[2];
          assdeassBtn.className = assdeassBtn.className.replace('disabled','');
     }
}
var manageMember = function(sender,action)
{
     var curProject = getCurrentProject();
     if (action == 'add')
     {
          var memberToAdd = window.prompt("Member Name:","firstname_lastname");
          if (memberToAdd == null) return;
          Condor.queryMember({"function": "add", "member": memberToAdd, "project": curProject},function(response) {
               if (response.result == "success")
               {
                    newRow = document.createElement("tr");
                    newRow.className = 'regrow';
                    newRow.onclick = function () { changeMember(this); };
                         var newRowName = document.createElement("td");
                         newRowName.innerHTML = memberToAdd;
                         newRow.appendChild(newRowName);
                         var newRowRole = document.createElement("td");
                         newRowRole.innerHTML = "Member";
                         newRow.appendChild(newRowRole);
                         var newRowTasks = document.createElement("td");
                         newRowTasks.innerHTML = "0";
                         newRow.appendChild(newRowTasks);
                    document.getElementById("project-members").getElementsByTagName('tbody')[0].appendChild(newRow);
               }
               else
               {
                    window.alert("ERROR Adding member "+memberToAdd+":\n\n"+response.msg);
               }
          });
     }

     var selected = getSelectedMemberRow();
     if (selected == undefined || sender.className.includes('disabled'))
     {
          return;
     }
     var memberTags = getSelectedMemberRow().getElementsByTagName('td');
     var memberName = memberTags[0].innerHTML;

     if (action == 'del')
     {
          Condor.queryMember({"function": "delete", "member": memberName, "project": curProject},function(response) {
               if (response.result == "success")
               {
                    getSelectedMemberRow().parentNode.removeChild(getSelectedMemberRow());
               }
               else
               {
                    window.alert("ERROR Deleting member "+memberName+":\n\n"+response.msg);
               }
          });
     }
     else if (action == 'promdem' && sender.innerHTML == "Promote to Project Manager")
     {
          Condor.queryMember({"function": "promote", "member": memberName, "project": curProject},function(response) {
               if (response.result == "success")
               {
                    memberTags[1].innerHTML = "Project Manager";
                    sender.innerHTML = "Demote to Member";
               }
               else
               {
                    window.alert("ERROR Promoting member "+memberName+":\n\n"+response.msg);
               }
          });
     }
     else if (action == 'promdem' && sender.innerHTML == "Demote to Member")
     {
          Condor.queryMember({"function": "demote", "member": memberName, "project": curProject},function(response) {
               if (response.result == "success")
               {
                    memberTags[1].innerHTML = "Member";
                    sender.innerHTML = "Promote to Project Manager";
               }
               else
               {
                    window.alert("ERROR Demoting member "+memberName+":\n\n"+response.msg);
               }
          });
     }
}

myTaskSelected = function(sender,norecurse)
{
     var old = document.getElementById('project-your-tasks').getElementsByClassName('regrow-active')[0];
     if (old != undefined)
          old.className = old.className.replace('regrow-active','regrow');
     sender.className = sender.className.replace('regrow','regrow-active');

     var status = sender.getElementsByTagName('td')[1].innerHTML;
     var statusSel = document.getElementById('project-your-tasks-btns').getElementsByTagName('select')[0];
     statusSel.disabled = false;
     for (var i=0;i<statusSel.options.length;i++)
     {
          if (statusSel.options[i].text === status)
          {
               statusSel.selectedIndex = i;
               break;
          }
     }

     if (norecurse)
          return;

     var tasks = document.getElementById('project-all-tasks').getElementsByTagName('tr');
     for (var i=0;i<tasks.length;i++)
     {
          var cells = tasks[i].getElementsByTagName('td');
          if (cells[0].innerHTML == sender.getElementsByTagName('td')[0].innerHTML)
               taskSelected(tasks[i],true);
     }
}
var changeMyTask = function(sender)
{
     var taskName = getSelectedMyTaskRow().getElementsByTagName('td')[0].innerHTML;
     var status = sender.options[sender.selectedIndex].text;
     Condor.queryProject({"function": "status", "project": getCurrentProject(), "task": taskName, "status": status},function(response) {
          if (response.result == "success")
          {
               getSelectedMyTaskRow().getElementsByTagName('td')[1].innerHTML = sender.options[sender.selectedIndex].text;
               getSelectedTaskRow().getElementsByTagName('td')[2].innerHTML = sender.options[sender.selectedIndex].text;
          }
          else
          {
               window.alert("ERROR Updating task status:\n\n"+response.msg);
          }
     });
}
var mySortFuncs = {
     "Task Name": function(a,b) {
          var aname = Date.parse(a.getElementsByTagName('td')[0].innerHTML);
          var bname = Date.parse(b.getElementsByTagName('td')[0].innerHTML);
          return bname < aname;
     },
     "Due Date (Soonest first)": function (a,b) {
          var adue = Date.parse(a.getElementsByTagName('td')[2].innerHTML);
          var bdue = Date.parse(b.getElementsByTagName('td')[2].innerHTML);
          if (isNaN(adue) || isNaN(bdue))
          {
               return 0;
          }
          var adueunix = adue/1000;
          var bdueunix = bdue/1000;

          return adue - bdue;
     },
     "Due Date (Soonest last)": function (a,b) {
          var adue = Date.parse(a.getElementsByTagName('td')[2].innerHTML);
          var bdue = Date.parse(b.getElementsByTagName('td')[2].innerHTML);
          if (isNaN(adue) || isNaN(bdue))
          {
               return 0;
          }
          var adueunix = adue/1000;
          var bdueunix = bdue/1000;

          return bdue - adue;
     },
     "Status": function(a,b) {
          var astatus = Date.parse(a.getElementsByTagName('td')[1].innerHTML);
          var bstatus = Date.parse(b.getElementsByTagName('td')[1].innerHTML);
          return bstatus < astatus;
     },
};
function updateMyTaskList()
{
     var myTasksRows = document.getElementById("project-your-tasks").getElementsByTagName('tr');
     for (var i=1;i<myTasksRows.length;i++)
     {
          myTasksRows[i].parentNode.removeChild(myTasksRows[i]);
          i--;
     }

     var tasksRows = document.getElementById('project-all-tasks').getElementsByTagName('tr');
     myTasksRows = [];
     for (var i=1;i<tasksRows.length;i++)
     {
          var cells = tasksRows[i].getElementsByTagName('td');
          var newrow = null;
          if (cells[1].innerHTML == document.getElementById('user-id').innerHTML)
          {
               newRow = document.createElement("tr");
               newRow.className = 'regrow';
               if (tasksRows[i].className.includes('regrow-active'))
               {
                    newRow.className = 'regrow-active';
               }
               newRow.onclick = function () { myTaskSelected(this); };
                    var newRowTask = document.createElement("td");
                    newRowTask.innerHTML = cells[0].innerHTML;
                    newRow.appendChild(newRowTask);
                    var newRowStatus = document.createElement("td");
                    newRowStatus.innerHTML = cells[2].innerHTML;
                    newRow.appendChild(newRowStatus);
                    var newRowDate = document.createElement('td');
                    newRowDate.innerHTML = cells[3].innerHTML;
                    newRow.appendChild(newRowDate);
                    var newRowDescription = document.createElement("td");
                    newRowDescription.innerHTML = cells[4].innerHTML;
                    newRow.appendChild(newRowDescription);
               myTasksRows.push(newRow);
          }
     }

     myTasksRows.sort(mySortFuncs[document.getElementById('project-my-tasks-sort').getElementsByTagName('select')[0].value]);

     for (t in myTasksRows)
     {
          document.getElementById("project-your-tasks").getElementsByTagName('tbody')[0].appendChild(myTasksRows[t]);
     }
}
var sortFuncs = {
     "Task Name": function(a,b) {
          var aname = Date.parse(a.getElementsByTagName('td')[0].innerHTML);
          var bname = Date.parse(b.getElementsByTagName('td')[0].innerHTML);
          return bname < aname;
     },
     "Due Date (Soonest first)": function (a,b) {
          var adue = Date.parse(a.getElementsByTagName('td')[3].innerHTML);
          var bdue = Date.parse(b.getElementsByTagName('td')[3].innerHTML);
          if (isNaN(adue) || isNaN(bdue))
          {
               return 0;
          }
          var adueunix = adue/1000;
          var bdueunix = bdue/1000;

          return adue - bdue;
     },
     "Due Date (Soonest last)": function (a,b) {
          var adue = Date.parse(a.getElementsByTagName('td')[3].innerHTML);
          var bdue = Date.parse(b.getElementsByTagName('td')[3].innerHTML);
          if (isNaN(adue) || isNaN(bdue))
          {
               return 0;
          }
          var adueunix = adue/1000;
          var bdueunix = bdue/1000;

          return bdue - adue;
     },
     "Status": function(a,b) {
          var astatus = Date.parse(a.getElementsByTagName('td')[2].innerHTML);
          var bstatus = Date.parse(b.getElementsByTagName('td')[2].innerHTML);
          return bstatus < astatus;
     },
     "Assigned Member": function(a,b) {
          var aass = Date.parse(a.getElementsByTagName('td')[1].innerHTML);
          var bass = Date.parse(b.getElementsByTagName('td')[1].innerHTML);
          return bass < aass;
     }
};
function updateTaskList()
{
     var tasks = [].slice.call(document.getElementById("project-all-tasks").getElementsByTagName('tr'));

     if (tasks.length == 0)
     {
          return;
     }
     var func = document.getElementById('project-all-tasks-sort').getElementsByTagName('select')[0].value;

     tasks.sort(sortFuncs[func]);

     //clear the tasks table
     for (var t=1;t<tasks.length;t++)
     {
          tasks[t].parentNode.removeChild(tasks[t]);
     }

     //rebuild the tasks table
     for (t in tasks)
     {
          document.getElementById('project-all-tasks').getElementsByTagName('tbody')[0].appendChild(tasks[t]);
     }
}
function updateAssignedTaskCounter()
{
     var members = document.getElementById("project-members").getElementsByTagName('tr');
     for (var m=1;m<members.length;m++)
     {
          var cells = members[m].getElementsByTagName('td');
          var tasks = document.getElementById("project-all-tasks").getElementsByTagName('tr');
          var cnt = 0;
          for (var t=1;t<tasks.length;t++)
          {
               var tcells = tasks[t].getElementsByTagName('td');
               if (cells[0].innerHTML == tcells[1].innerHTML)
               {
                    cnt++;
               }
          }
          cells[2].innerHTML = cnt;
     }
}

taskSelected = function(sender,norecurse)
{
     var old = document.getElementById('project-all-tasks').getElementsByClassName('regrow-active')[0];
     if (old != undefined)
          old.className = old.className.replace('regrow-active','regrow');
     sender.className = sender.className.replace('regrow','regrow-active');

     var deleteBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[1];
     var editDateBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[3];
     var editDescBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[4];
     deleteBtn.className = deleteBtn.className.replace('disabled','');
     editDateBtn.className = editDateBtn.className.replace('disabled','');
     editDescBtn.className = editDescBtn.className.replace('disabled','');

     var assdeassBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[2];
     if (sender.getElementsByTagName('td')[1].innerHTML != "")
     {
          assdeassBtn.innerHTML = "Deassign";
          assdeassBtn.className = assdeassBtn.className.replace('disabled','');
     }
     else
     {
          assdeassBtn.innerHTML = "Assign to Member";
          if (getSelectedMemberRow() != undefined)
          {
               assdeassBtn.className = assdeassBtn.className.replace('disabled','');
          }
     }

     if (norecurse)
          return;

     var tasks = document.getElementById('project-your-tasks').getElementsByTagName('tr');
     for (var i=0;i<tasks.length;i++)
     {
          var cells = tasks[i].getElementsByTagName('td');
          if (cells[0].innerHTML == sender.getElementsByTagName('td')[0].innerHTML)
               myTaskSelected(tasks[i],true)
          else
          {
               tasks[i].className = tasks[i].className.replace('regrow-active','regrow');
               document.getElementById('project-your-tasks-btns').getElementsByTagName('select')[0].disabled = true;
          }
     }
}

createTask = function(sender)
{
     var name = window.prompt("Task Name","A task");
     if (name == null) return;
     var due = window.prompt("Due date", "MM-DD-YYYY");
     if (due == null) return;
     var dueunix = (new Date(due)).getTime()/1000;
     var description = window.prompt("Task description", "");
     if (description == null) return;

     Condor.queryProject({"function": "createtask", "project": getCurrentProject(), "name": name, "due": dueunix, "desc": description},function(response) {
          if (response.result == "success")
          {
               //create a new row in the task table
               var newRow = document.createElement("tr");
               newRow.className = 'regrow';
               newRow.onclick = function () { myTaskSelected(this); };
                    var newRowTask = document.createElement("td");
                    newRowTask.innerHTML = name;
                    newRow.appendChild(newRowTask);
                    var newRowAssigned = document.createElement("td");
                    newRowAssigned.innerHTML = "NOT ASSIGNED";
                    newRow.appendChild(newRowAssigned);
                    var newRowStatus = document.createElement('td');
                    newRowStatus.innerHTML = "No Work Done";
                    newRow.appendChild(newRowStatus);
                    var newRowDue = document.createElement('td');
                    newRowDue.innerHTML = due;
                    newRow.appendChild(newRowDue);
                    var newRowDescription = document.createElement("td");
                    newRowDescription.innerHTML = description;
                    newRow.appendChild(newRowDescription);
               document.getElementById("project-all-tasks").getElementsByTagName('tbody')[0].appendChild(newRow);
          }
          else
          {
               window.alert("ERROR Creating task '"+name+"':\n\n"+response.msg);
          }
     });
}

deleteTask = function(sender)
{
     var selected = getSelectedTaskRow();
     if (selected == undefined || sender.className.includes('disabled'))
     {
          return;
     }

     Condor.queryProject({"function": "deletetask", "project": getCurrentProject(), "name": selected.getElementsByTagName('td')[0].innerHTML},function(response) {
          if (response.result == "success")
          {
               getSelectedTaskRow().parentNode.removeChild(getSelectedTaskRow());
               document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[1].className += " disabled";
               document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[3].className += " disabled";
               document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[4].className += " disabled";
               document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[2].className += " disabled";
               updateMyTaskList();
               updateAssignedTaskCounter();
          }
          else
          {
               window.alert("ERROR Deleting task '"+selected.getElementsByTagName('td')[0].innerHTML+"':\n\n"+response.msg);
          }
     });
}

assdeassTask = function(sender)
{
     var selected = getSelectedTaskRow();
     if (selected == undefined || sender.className.includes('disabled'))
     {
          console.log("bada");
          return;
     }

     var taskName = getSelectedTaskRow().getElementsByTagName('td')[0].innerHTML;
     if (sender.innerHTML == "Assign to Member")
     {
          var curMember = getSelectedMemberRow().getElementsByTagName('td')[0].innerHTML;
          Condor.queryProject({"function": "assign", "project": getCurrentProject(), "task": taskName, "member": curMember},function(response) {
               if (response.result == "success")
               {
                    getSelectedTaskRow().getElementsByTagName('td')[1].innerHTML = curMember;
                    var assdeassBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[2];
                    assdeassBtn.innerHTML = "Deassign";
                    updateMyTaskList();
                    updateAssignedTaskCounter();
               }
               else
               {
                    window.alert("ERROR Assigning task to "+curMember+":\n\n"+response.msg);
               }
          });
     }
     else
     {
          Condor.queryProject({"function": "deassign", "project": getCurrentProject(), "task": taskName},function(response) {
               if (response.result == "success")
               {
                    getSelectedTaskRow().getElementsByTagName('td')[1].innerHTML = "NOT ASSIGNED";
                    var assdeassBtn = document.getElementById('project-all-tasks-btns').getElementsByTagName('p')[2];
                    assdeassBtn.innerHTML = "Assign to Member";
                    updateMyTaskList();
                    updateAssignedTaskCounter();
               }
               else
               {
                    window.alert("ERROR Deassigning task:\n\n"+response.msg);
               }
          });
     }
}

editDate = function(sender)
{
     var taskDate = getSelectedTaskRow().getElementsByTagName('td')[3].innerHTML;
     var newDate = window.prompt("Enter Date", taskDate);
     if (newDate == null) return;

     var dueunix = (new Date(newDate)).getTime()/1000;
     var taskName = getSelectedTaskRow().getElementsByTagName('td')[0].innerHTML;
     Condor.queryProject({"function": "editdate", "project": getCurrentProject(), "task": taskName, "date": dueunix},function(response) {
          if (response.result == "success")
          {
               getSelectedTaskRow().getElementsByTagName('td')[3].innerHTML = newDate;
               if (getSelectedTaskRow().getElementsByTagName('td')[1].innerHTML == document.getElementById('user-id').innerHTML)
               {
                    getSelectedMyTaskRow().getElementsByTagName('td')[2].innerHTML = newDate;
               }
          }
          else
          {
               window.alert("ERROR: Failed to change date to "+newDate+":\n\n"+response.msg);
          }
     });
}
editDesc = function(sender)
{
     var taskDesc = getSelectedTaskRow().getElementsByTagName('td')[4].innerHTML;
     var newDesc = window.prompt("Enter Description", taskDesc);
     if (newDesc == null) return;
     var taskName = getSelectedTaskRow().getElementsByTagName('td')[0].innerHTML;
     Condor.queryProject({"function": "editdesc", "project": getCurrentProject(), "task": taskName, "desc": newDesc},function(response) {
          if (response.result == "success")
          {
               getSelectedTaskRow().getElementsByTagName('td')[4].innerHTML = newDesc;
               if (getSelectedTaskRow().getElementsByTagName('td')[1].innerHTML == document.getElementById('user-id').innerHTML)
               {
                    getSelectedMyTaskRow().getElementsByTagName('td')[3].innerHTML = newDesc;
               }
          }
          else
          {
               window.alert("ERROR: Failed to change description:\n\n"+response.msg);
          }
     });
}
