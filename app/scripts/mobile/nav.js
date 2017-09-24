function changeProject(event)
{
     if (event == null)
     {
          $('#content').html("<div id='noproject'>404: project not found</div>");
          document.title = "Condor | Project not Found";
          return;
     }

     WAIT_ShowWait();

     var sender = event.target || event.srcElement;

     Condor.GetProject(sender.innerHTML.replace(/ /g,'_').toLowerCase(),function(res) {
          //set the active project in the sidebar
          $('.sidebar-item-active').addClass('sidebar-item');
          $('.sidebar-item-active').removeClass('sidebar-item-active');
          $(sender).addClass('sidebar-item-active');
          $(sender).removeClass('sidebar-item');
          //display the project page content
          $('#content').html(res);
          //scale the page content to the display
          var titleSz = window.innerWidth*0.08;
          $('#project-title').css('font-size',titleSz);
          $('#project-description').css('font-size',titleSz/3);
          $('.project-section').css('padding-left',window.innerWidth * 0.05);
          $('.project-section').css('padding-right',window.innerWidth * 0.05);
          $('.project-section').css('margin-top',window.innerWidth * 0.05);
          $('.project-section > p').css('font-size',titleSz);
          $('.header').css('font-size',titleSz/3);
          //set the page title
          document.title = "Condor | "+sender.innerHTML;
          //add the project URL to the browser's history
          history.pushState('data to be passed', "Condor | "+$(sender).html(), "/project/"+$(sender).html().replace(/ /g,'_').toLowerCase());
          //update the page stuff
          updateTaskList();
          updateMyTaskList();
          updateAssignedTaskCounter();
          //check for delete permission
          Condor.queryPermission({"permission": "deleteproject", "project": sender.innerHTML.replace(/ /g,'_').toLowerCase()},function(res) {
               if (res.haspermission) document.getElementById('projects-delete').className = document.getElementById('projects-delete').className.replace("nodisplay","");
               //check member management permission
               Condor.queryPermission({"permission": "managemembers", "project": sender.innerHTML.replace(/ /g,'_').toLowerCase()},function(res) {
                    if (res.haspermission) document.getElementById('project-members-buttons').className = "";
                    //check task management permission
                    Condor.queryPermission({"permission": "managetasks", "project": sender.innerHTML.replace(/ /g,'_').toLowerCase()},function(res) {
                         if (res.haspermission) document.getElementById('project-all-tasks-btns').className = "";
                         //hide the sidebar
                         toggleSidebar();
                         //show the content
                         $('#content').show(500);
                         WAIT_HideWait();
                    });
               });
          });
     });
}
