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

var https = require('https');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var config = require('../config/config.json');
var mime = require('mime-types');
var projectsmod = require('./api/projectsapi');
var membersmod = require('./api/membersapi');
var permsmod = require('./api/permissionsapi');
var authmod = require('./api/authapi');

var h2 = "";
var app = express();
var appforward = express();

function mysql_real_escape_string_json (json) {
     for (var k in json)
     {
          if (json[k].constructor == [].constructor || json[k].constructor == {}.constructor)
          {
               mysql_real_escape_string_json(json[k]);
          }
          else if (json[k].constructor == "a".constructor)
          {
               json[k] = json[k].replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
                    switch (char) {
                         case "\0":
                         return "\\0";
                         case "\x08":
                         return "\\b";
                         case "\x09":
                         return "\\t";
                         case "\x1a":
                         return "\\z";
                         case "\n":
                         return "\\n";
                         case "\r":
                         return "\\r";
                         case "\"":
                         case "'":
                         case "\\":
                         case "%":
                         return "\\"+char; // prepends a backslash to backslash, percent,
                         // and double/single quotes
                    }
               });
          }
     }
}

function checkBinServe(req,res)
{
     var r = /\/(images|fonts|scripts|styles)\/(.*)/g;
     var m = r.exec(req.url);

     var exists = false;
     if (m)
     {
          try {
               fs.statSync('app/'+m[1]+'/'+m[2]);
               exists = true;
          } catch (e) {}

          if (!exists)
          {
               res.writeHead(404, {"Content-Type": "text/plain"});
               res.write("404 Not Found");
               res.end();
               return true;
          }

          res.writeHead(200, {'Content-Type': mime.lookup('../'+m[1]+'/'+m[2])});
          res.end(fs.readFileSync('app/'+m[1]+'/'+m[2]), 'binary');
          return true;
     }
     return false;
}

function checkApiServe(req,res)
{
     var sanitizedBody = req.body;
     mysql_real_escape_string_json(sanitizedBody);

     var r = /\/api\/([^\/]*)\/?([^\?]*)?/g;
     var m = r.exec(req.url);
     if (m)
     {
          if (m[1] == "project")
          {
               projectsmod.processAPICall(sanitizedBody,function(resp) {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.write(JSON.stringify(resp));
                    res.end();
               });
          }
          else if (m[1] == "member")
          {
               membersmod.processAPICall(sanitizedBody,function(resp)  {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.write(JSON.stringify(resp));
                    res.end();
               });
          }
          else if (m[1] == "permission")
          {
               permsmod.getPermission(sanitizedBody,function(resp)  {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.write(JSON.stringify(resp));
                    res.end();
               });
          }
          else if (m[1] == "auth")
          {
               authmod.processAPICall(sanitizedBody,function(resp)  {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.write(JSON.stringify(resp));
                    res.end();
               });
          }

          return true;
     }
     return false;
}

app.get('/*',function(req,res) {
     if (!checkBinServe(req,res) && !checkApiServe(req,res))
     {
          h2(res,req,function(content) {
               res.writeHead(200, {'Content-Type': 'text/html'});
               res.write(content);
               res.end();
          });
     }
});

var jsonParser = bodyParser.json();
app.post('/*',jsonParser,function(req,res) {
     if (!checkBinServe(req,res) && !checkApiServe(req,res))
     {
          h2(res,req,function(content) {
               res.writeHead(200, {'Content-Type': 'text/html'});
               res.write(content);
               res.end();
          });
     }
});

appforward.get('/*',function(req,res) {
     console.log("Redirecting HTTP request to "+"https://"+req.headers.host+req.url);
     res.redirect("https://"+req.headers.host+req.url);
});

var jsonParser = bodyParser.json();
appforward.post('/*',jsonParser,function(req,res) {
     console.log("Redirecting HTTP request to "+"https://"+req.headers.host+req.url);
     res.redirect("https://"+req.headers.host+req.url);
});

var methods = {
     /*
          start(h)

          Start the web server

          Parameters:
               h    Function to call when handling requests
          Returns:
               null
     */
     start: function(h,hp)
     {
          var k = null;
          var c = null;
          try
          {
               k = fs.readFileSync(config["server"]["ssl_key"]);
               c = fs.readFileSync(config["server"]["ssl_cert"]);
          } catch(e){}
          //read in the SSL certificate and key
          var options = {
               key: k,
               cert: c
          };

          h2 = h;

          var failhttps = false;

          if (config["server"]["https"])
          { //start the HTTPS server if configured to do so
               if (k != null && c != null)
               {
                    console.log("[INFO]\t\tStarting HTTPS listener on port "+config["server"]["https_port"]);
                    https.createServer(options, app).listen(config["server"]["https_port"]);
               }
               else
               {
                    console.warn("[WARNING]\tNot starting HTTPS listener: '"+((k == null) ? config["server"]["ssl_key"] : config["server"]["ssl_cert"])+"' does not exist");
                    failhttps = true;
               }
          }
          if (config["server"]["http"])
          { //start the HTTP server if configured to do so
               console.log("[INFO]\t\tStarting HTTP listener on port "+config["server"]["http_port"]);
               if (config["server"]["http_forward"])
               {
                    console.log("[INFO]\t\tHTTPS forwarding enabled, HTTP requests will be redirected to HTTPS");
                    http.createServer(appforward).listen(config["server"]["http_port"]);
                    if (failhttps)
                    {
                         console.error("[FATAL]\t\tHTTPS listener failed to start but Condor is configured to redirect HTTP requests to HTTPS. Exiting...");
                         process.exit();
                    }
               }
               else
               {
                    console.log("[INFO]\t\tHTTPS forwarding disabled, HTTP request responses will be served directly");
                    http.createServer(app).listen(config["server"]["http_port"]);
               }

          }

          console.log("[INFO]\t\tCondor initialized!");
     }
};
module.exports = methods;
