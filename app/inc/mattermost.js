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

var config = require('../config/config.json');
var req = require('sync-request');

var uname = "";

function APICall(token,data,className)
{
     var method = ((data == null) ? "GET" : "POST");

     var reqdata = {
          'headers': {
               'Content-Type': 'application.json',
               'Authorization': 'Bearer ' + token
          },
          json: data
     };

     var res = req(method, config["mattermost"]["host"]+"/api/v4"+className, reqdata);
     var json = "";
     var head = res.headers;

     if (res.statusCode != 200)
     {
          json = {"fail": "yes", "msg": res.statusCode};
     }
     else
     {
          json = JSON.parse(res.getBody('utf8'));
     }

     return {data: json, token: head['token']};
}

var methods = {
     login: function(uname,password)
     {
          var json = {
               "login_id": uname,
               "password": password
          };
          //call the API to log in
          var res = APICall(null,json,"/users/login");
          //check if either the API call failed or the login failed
          if (res.data["fail"] == "yes" || res.token == null)
          {
               return {token: null, username: ""};
          }

          token = res.token;
          uname = res.data.username;
          return {token: res.token, username: uname};
     },
     logout: function(token)
     {
          var res = APICall(token,{},"/users/logout");
          return {success: (res.data.fail != "yes"), msg: res.data.msg};
     },
     restorelogin: function(token)
     {
          var res = APICall(token,null,"/users/me");
          if (res.data.length == 0)
          {
               return {token: null, username: null};
          }

          return {token: token, username: res.data.username};
     },
     getTeam: function(token)
     {
          var res = APICall(token,null,"/users/me/teams");
          if (res.data.length == 0)
          {
               return {token: null, username: null};
          }
          return {team: res.data[0].display_name};
     },
     getAuthUser: function(token)
     {
          var res = APICall(token,null,"/users/me");
          if (res.data.length == 0)
          {
               return {token: null, username: null};
          }
          return res.data.username;
     },
     getIsUserAdmin: function(token)
     {
          var res = APICall(token,null,"/users/me");
          if (res.data.fail)
          {
               return false;
          }
          return res.data.roles.includes('system_admin');
     },
     userExists: function(userid,token)
     {
          var res = APICall(token,[userid],"/users/usernames");
          return (res.data.length > 0);
     }
};
module.exports = methods;
