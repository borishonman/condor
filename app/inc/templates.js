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

var handlebars = require('handlebars');
var fs = require('fs');

//EDIT THIS: list of template files
var templates = {
     "main": "main.html",
     "project": "project.html",
     "members": "members.html",
     "login": "login.html"
};

//compiled templates will be stored here
var compiledTemplates = {};

var methods = {
     /*
          load()

          Load all template files and compile them

          Parameters:    null
          Returns:       null
     */
     load: function()
     {
          for (var k in templates)
          {
               var v = templates[k];
               compiledTemplates[k] = handlebars.compile(fs.readFileSync('app/templates/'+v).toString());
          }
     },
     /*
          getHTML(template,data)

          Get the HTML for a template after giving it data to fill with

          Parameters:
               template:      string of the name of the template to use
               data:          the data to fill the template with
          Returns:  null
     */
     getHTML: function(template,data)
     {
          if ((template in compiledTemplates))
          {
               return compiledTemplates[template](data);
          }
          return null;
     }
};
module.exports = methods;
