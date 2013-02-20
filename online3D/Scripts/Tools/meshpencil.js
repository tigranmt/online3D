TOOLS.MeshPencil = function () {

    var _this = this;

    this.color = 0xffee99; //default selection color
    this.title = "Mesh pencil";
    this.text = "Choose a color and color mesh with mouse.";
    this.htmlUI = //"<div class='well'>" + 
			        "<div class='input-append color' data-color='rgb(255, 146, 180)'  id='cp3'>" +
				        "<input type='text' class='span2' value='' readonly=''>" +
				        "<span class='add-on' id='backcolor_i' style='cursor:pointer;'></span>" +
			        "</div>";
    //"</div>";

    this.uiWidth = 300;


    this.start = function () {
        console.log("Start mesh pencil");
        document.addEventListener('mousemove', onMouseMove, false);

        TOOLS.current = _this;
        $("#backcolor_i").css("background-color","" + this.hexToRgba(this.color) + "");
        $("#backcolor_i").click(function (event) {
            $('.colorpicker').colorpicker().on('changeColor', function (ev) {
                $("#backcolor_i").backgroundColor = ev.color.toHex();
            });
        });



    };


    this.hexToRgba = function (hex) {
        var c = hex;
        var r = (c & (0xff << 24)) >>> 24;
        var g = (c & (0xff << 16)) >>> 16;
        var b = (c & (0xff << 8)) >>> 8;
        var a = (c & 0xff) / 0xff;
        return 'rgba(' + [r, g, b, a].join(',') + ')';
    };

    this.stop = function () {
        console.log("Stop mesh pencil");
        document.removeEventListener('mousemove', onMouseMove, false);
    };


    var onMouseMove = function (event) {

        if (event.button === 1) {//left button
            var intersection = TOOLS.getIntersectionFromMouseCoord(event);
            if (intersection !== undefined) {
                intersection[0].face.setHex(this.color);
            }
        }
    };

}

//Point to point measurer
TOOLS.MeshPencil.prototype = {
    constructor: TOOLS.Tool(TOOLS.MESH_PENCIL)
};