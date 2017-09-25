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

var Condor = {
     Request: function(className,action,data,callback)
     {
          data["token"] = getCookie("token");
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.addEventListener('load', function() {callback(JSON.parse(this.responseText));});
          xmlhttp.onerror = function(error) {
               callback({"result": "fail", "msg": "Failed to connect to Condor server."});
          };
          xmlhttp.open("POST","/api/"+className+"/"+action,true);
          xmlhttp.setRequestHeader("Content-Type", "application/json");
          xmlhttp.send(JSON.stringify(data));
     },
     GetProject: function(project,callback)
     {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.addEventListener('load', function() {callback(this.responseText);});
          xmlhttp.onerror = function(error) {
               callback("Failed to connect to Condor server.");
          };
          xmlhttp.open("POST","/getproject/"+project,true);
          xmlhttp.setRequestHeader("Content-Type", "application/json");
          xmlhttp.send(JSON.stringify({"project": project, "token": getCookie("token")}));
     },
     GetLogin: function(callback)
     {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.addEventListener('load', function() {callback(this.responseText);});
          xmlhttp.onerror = function(error) {
               callback("Failed to connect to Condor server.");
          };
          xmlhttp.open("POST","/login/",true);
          xmlhttp.setRequestHeader("Content-Type", "application/json");
          xmlhttp.send(null);
     },
     GetHome: function(callback)
     {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.addEventListener('load', function() {callback(this.responseText);});
          xmlhttp.onerror = function(error) {
               callback("Failed to connect to Condor server.");
          };
          xmlhttp.open("POST","/home/",true);
          xmlhttp.setRequestHeader("Content-Type", "application/json");
          xmlhttp.send(null);
     },

     queryProject: function(query,callback)
     {
          this.Request("project","",query,callback);
     },
     queryMember: function(query,callback)
     {
          this.Request("member","",query,callback);
     },
     queryPermission: function(query,callback)
     {
          this.Request("permission","",query,callback);
     },
     queryAuth: function(query,callback)
     {
          this.Request("auth","",query,callback);
     }
}
