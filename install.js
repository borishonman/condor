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

var config = require("./app/config/config.json");
var mysql = require("mysql");

var stdin = process.openStdin();

var host = config["database"]["host"];
var dbname = config["database"]["database"];
var user = config["database"]["user"];
var pass = config["database"]["password"];
var prefix = config["database"]["prefix"];

var sql = [
     {name: "projects", values: "id VARCHAR(128) NOT NULL, title VARCHAR(128) NOT NULL, creator VARCHAR(30) NOT NULL, create_time DATETIME NOT NULL, description VARCHAR(256) NULL, PRIMARY KEY(id)"},
     {name: "tasks", values: "id INT NOT NULL AUTO_INCREMENT, project VARCHAR(128) NOT NULL, task VARCHAR(64) NOT NULL, assigned VARCHAR(30) NULL, status VARCHAR(20) NOT NULL, due DATE NOT NULL, description VARCHAR(128) NULL, created DATETIME NOT NULL, created_by VARCHAR(30), PRIMARY KEY(id), FOREIGN KEY (project) REFERENCES "+prefix+"projects(id)"},
     {name: "member_assignments", values: "id INT NOT NULL AUTO_INCREMENT, userid VARCHAR(30) NOT NULL, project VARCHAR(128) NOT NULL, role VARCHAR(20) NOT NULL, PRIMARY KEY(id), FOREIGN KEY (project) REFERENCES "+prefix+"projects(id)"},
     {name: "permissions", values: "id INT NOT NULL AUTO_INCREMENT, userid VARCHAR(30) NOT NULL, cancreateprojects BOOL NOT NULL DEFAULT 0, ismoderator BOOL NOT NULL DEFAULT 0, PRIMARY KEY(id)"}
];

console.log("Welcome to the Condor installer!");
console.log("The following settings will be used when setting up MySQL:")
console.log("\tHost: "+host);
console.log("\tDB: "+dbname);
console.log("\tUser: "+user);
console.log("\tTable prefix: "+prefix);

console.log("");

console.log("Are these settings OK? (y/n)");

stdin.addListener("data", function(d) {
     // note:  d is an object, and when converted to a string it will
     // end with a linefeed.  so we (rather crudely) account for that
     // with toString() and then trim()
     var res = d.toString().trim();
     if (res == 'y' || res == 'Y')
     {
          //try to connect to the mysql server
          var con = mysql.createConnection({
               host: host,
               database: dbname,
               user: user,
               password: pass
          });
          con.connect(function(err) {
               if (err != null)
               {
                    console.error("[ERROR]: Could not connect to database at '"+host+"': "+err.code + " "+(err.sqlMessage != undefined ? err.sqlMessage : ""));
                    con.end();
                    process.exit();
               }
               var cnt = 0;
               for (t in sql)
               {
                    console.log("Creating "+prefix+sql[t].name+"...");
                    con.query("CREATE TABLE "+prefix+sql[t].name+" ("+sql[t].values+")",function(err,result) {
                         if (err != null)
                         {
                              console.error("[ERROR]: Could not create table "+prefix+this+": "+err.code + " "+(err.sqlMessage != undefined ? err.sqlMessage : ""));
                              con.end();
                              process.exit();
                         }
                         console.log("Done creating table "+prefix+this);
                         cnt++;
                         if (cnt == sql.length)
                         {
                              console.log("Condor has been set up!");
                              con.end();
                              process.exit();
                         }
                    }.bind(sql[t].name));
               }
               con.end();
          });
     }
});
