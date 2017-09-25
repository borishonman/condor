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

var WAIT_CurIndex;
const WAIT_Total = 8;
var WAIT_Timer;
var WAIT_Images = [
     {src: "/images/wait/1.svg", loaded: false},
     {src: "/images/wait/2.svg", loaded: false},
     {src: "/images/wait/3.svg", loaded: false},
     {src: "/images/wait/4.svg", loaded: false},
     {src: "/images/wait/5.svg", loaded: false},
     {src: "/images/wait/6.svg", loaded: false},
     {src: "/images/wait/7.svg", loaded: false},
     {src: "/images/wait/8.svg", loaded: false}
];

function WAIT_ShowWait()
{
     //size the indicator table
     $('#wait-table').width(window.innerWidth);
     $('#wait-table').height(window.innerHeight);
     //size the indicator itself
     var sz = ((window.innerWidth < window.innerHeight) ? window.innerWidth : window.innerHeight);
     var sz = sz*0.3;
     $('#wait-div').width(sz);
     $('#wait-div').height(sz);
     //set the background image
     $('#wait-div').css('background-image',"url('/images/wait/1.svg')");

     //set the timer to move to next image
     WAIT_Timer = setInterval(WAIT_Next,50);
     WAIT_CurIndex = 0;

     //show the indicator
     $('#wait-table').show();
}
function WAIT_HideWait()
{
     //hide the indicator
     $('#wait-table').hide();
     clearInterval(WAIT_Timer);
}

function WAIT_Next()
{
     if (WAIT_CurIndex == WAIT_Total-1)
     { //start over from image 1
          WAIT_CurIndex = 0;
     }
     else
     {
          WAIT_CurIndex += 1;
     }
     if (!WAIT_Images[WAIT_CurIndex].loaded)
     {
          var newImg = new Image();
          newImg.src = WAIT_Images[WAIT_CurIndex].src;
          newImg.onload = function() {
               WAIT_Images[this].loaded = true;
               $('#wait-div').css('background-image',"url('"+WAIT_Images[this].src+"')");
          }.bind(WAIT_CurIndex);
     }
     else
     {
          $('#wait-div').css('background-image',"url('"+WAIT_Images[WAIT_CurIndex].src+"')");
     }
}
