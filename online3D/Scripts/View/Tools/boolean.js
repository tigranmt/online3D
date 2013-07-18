TOOLS.Boolean = function () {

    var _this = this;  

    this.title = "Boolean";
    this.text = "Choose 2 models to execute boolean over";
    this.htmlUI = "<div class='btn-group'>" +
                    "<button id='substruct' class='btn'>Substruct</button>" +
                    "<button id='union' class='btn'>Union</button>" +
                     "<button id='diff' class='btn'>Diff</button>" +
                  "</div>";

    this.uiWidth = 300;


   


    this.start = function () {

        /**Subscribing to the mai bollean buttons action**/

        console.log("Start sculpturing");
      
        TOOLS.current = _this;

        $("#substruct").on('click', function (event) {
          
        });


        $("#union").on('click', function (event) {

           
        });

        $("#diff").on('click', function (event) {

         
        });
    };

    this.startAgent = function () {
        console.log("No agent call for " + this.title + " expected");
    };



    this.stop = function () {
        console.log("Stop boolean");
      
    };


   
};


//Point to point measurer
TOOLS.Boolean.prototype = TOOLS;
TOOLS.Boolean.prototype.constructor = TOOLS.Tool(TOOLS.BOOLEAN);