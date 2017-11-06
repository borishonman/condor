var handlebars = require('handlebars');
var MobileDetect = require('mobile-detect');
var fs = require('fs');
var req = require('sync-request');

function makeRequest(url)
{
     var reqdata = {
          'headers': {
               'Content-Type': 'application.json',
               'User-Agent': 'condor'
          },
     };
     var res = req("GET", url, reqdata);
     return res.getBody('utf8');
}

var methods = {
     handleRequest: function(req)
     {
          var isandroid = (new MobileDetect(req.headers['user-agent'])).os() == "AndroidOS";
          var isios = (new MobileDetect(req.headers['user-agent'])).os() == "iOS";

          //use regex to check for /app/ios - if match then return the plist
          var r = /\/(app)\/(ios)/g;
          var m = r.exec(req.url);
          if (m)
          {
               //find the latest release that contains an IPA
               var resp = JSON.parse(makeRequest("https://api.github.com/repos/borishonman/condor-app/releases"));
               var latestRelease = null;
               var latestAsset = null;
               for (var i=0;i<resp.length;i++)
               {
                    //extract the version #
                    var tag = parseFloat(resp[i]["tag_name"].substring(1));
                    //determine if this release has an APK
                    var hasApk = false;
                    for (var j=0;j<assets.length;j++)
                    {
                         if (assets[j]["name"].endsWith("ipa"))
                         {
                              hasApk = true;
                              break;
                         }
                    }
                    if (!hasApk)
                    {
                         continue;
                    }
                    if (latestRelease == null || parseFloat(latestRelease["tag_name"].substring(1)) < tag)
                    {
                         latestRelease = resp[i];
                         var assets = resp[i]["assets"];
                         for (var j=0;j<assets.length;j++)
                         {
                              if (assets[j]["name"].endsWith("ipa"))
                              {
                                   hasApk = true;
                                   latestAsset = assets[j];
                                   break;
                              }
                         }
                    }
               }

               var data = {
                    "link": latestAsset["browser_download_url"]
               };
               var template = handlebars.compile(fs.readFileSync('app/templates/manifest.plist').toString());
               return {
                    data: template(data),
                    type: 'application/xml'
               };
          }

          if (isandroid)
          {
               //find the latest release that contains an APK
               var resp = JSON.parse(makeRequest("https://api.github.com/repos/borishonman/condor-app/releases"));
               var latestRelease = null;
               var latestAsset = null;
               for (var i=0;i<resp.length;i++)
               {
                    //extract the version #
                    var tag = parseFloat(resp[i]["tag_name"].substring(1));
                    //determine if this release has an APK
                    var hasApk = false;
                    var assets = resp[i]["assets"];
                    for (var j=0;j<assets.length;j++)
                    {
                         if (assets[j]["name"].endsWith("apk"))
                         {
                              hasApk = true;
                              break;
                         }
                    }
                    if (!hasApk)
                    {
                         continue;
                    }
                    if (latestRelease == null || parseFloat(latestRelease["tag_name"].substring(1)) < tag)
                    {
                         latestRelease = resp[i];
                         var assets = resp[i]["assets"];
                         for (var j=0;j<assets.length;j++)
                         {
                              if (assets[j]["name"].endsWith("apk"))
                              {
                                   hasApk = true;
                                   latestAsset = assets[j];
                                   break;
                              }
                         }
                    }
               }

               var data = {
                    "text": "Download Android App",
                    "version": latestRelease["tag_name"],
                    "link":  latestAsset["browser_download_url"]
               };
               var template = handlebars.compile(fs.readFileSync('app/templates/appdeploy.html').toString());
               return {
                    data: template(data),
                    type: 'text/html'
               };
          }
          else if (isios)
          {
               //find the latest release that contains an IPA
               var resp = JSON.parse(makeRequest("https://api.github.com/repos/borishonman/condor-app/releases"));
               var latestRelease = null;
               var latestAsset = null;
               for (var i=0;i<resp.length;i++)
               {
                    //extract the version #
                    var tag = parseFloat(resp[i]["tag_name"].substring(1));
                    //determine if this release has an APK
                    var hasApk = false;
                    var assets = resp[i]["assets"];
                    for (var j=0;j<assets.length;j++)
                    {
                         if (assets[j]["name"].endsWith("ipa"))
                         {
                              hasApk = true;
                              break;
                         }
                    }
                    if (!hasApk)
                    {
                         continue;
                    }
                    if (latestRelease == null || parseFloat(latestRelease["tag_name"].substring(1)) < tag)
                    {
                         latestRelease = resp[i];
                         var assets = resp[i]["assets"];
                         for (var j=0;j<assets.length;j++)
                         {
                              if (assets[j]["name"].endsWith("ipa"))
                              {
                                   hasApk = true;
                                   latestAsset = assets[j];
                                   break;
                              }
                         }
                    }
               }

               var data = {
                    "text": "Download iOS App",
                    "version": latestRelease["tag_name"],
                    "link":  "itms-services://?action=download-manifest&url=http://"+req.headers.host+"/app/ios"
               };
               var template = handlebars.compile(fs.readFileSync('app/templates/appdeploy.html').toString());
               return {
                    data: template(data),
                    type: 'text/html'
               };
          }
          else
          {
               return "lolnope";
          }
     }
};
module.exports = methods;
