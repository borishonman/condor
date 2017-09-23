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

var toggleMemberCanCreate = function()
{
     var user = window.prompt("User to toggle create permission on");
     if (user == null) return;
     Condor.queryPermission({"permission": "togglecreateproject", "userid": user},function(res) {
          if (res.result != "success")
          {
               window.alert("Failed to toggle create project permission for '"+user+"':\n\n"+res.msg);
               return;
          }
          var rows = document.getElementById("members").getElementsByTagName('tr');
          var found = false;
          for (var r=0;r<rows.length;r++)
          {
               if (rows[r].getElementsByTagName('td')[0].innerHTML == user)
               {
                    console.log(res);
                    rows[r].getElementsByTagName('td')[1].innerHTML = res.haspermission;
                    found = true;
               }
          }
          if (!found)
          {
               var newRow = document.createElement('tr');
               newRow.className = "regrow";
               var newRowId = document.createElement('td');
               newRowId.className = "regcell";
               newRowId.innerHTML = user;
               newRow.appendChild(newRowId);
               var newRowCanCreate = document.createElement('td');
               newRowCanCreate.className = "regcell";
               newRowCanCreate.innerHTML = '1';
               newRow.appendChild(newRowCanCreate);
               document.getElementById('members').getElementsByTagName('tbody')[0].appendChild(newRow);
          }
     });
}
