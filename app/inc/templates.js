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
var MobileDetect = require('mobile-detect');

//EDIT THIS: list of template files
var templates = {
     "main": "main.html",
     "project": "project.html",
     "members": "members.html",
     "login": "login.html",
     "home": "home.html"
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
               compiledTemplates[k] = {
                    desktop: handlebars.compile(fs.readFileSync('app/templates/'+v).toString()),
                    mobile: handlebars.compile(fs.readFileSync('app/templates/mobile/'+v).toString())
               };
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
     getHTML: function(template,data,ua)
     {
          var ismobile = (new MobileDetect(ua)).mobile() != null;

          if ((template in compiledTemplates))
          {
               if (ismobile)
               {
                    return compiledTemplates[template].mobile(data);
               }
               return compiledTemplates[template].desktop(data);
          }
          return null;
     }
};
module.exports = methods;
