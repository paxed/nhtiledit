
var canvas = document.getElementById("paintarea");
if (!canvas.getContext) {
    alert("Canvas is not supported by your browser.");
    exit;
}
var ctx = canvas.getContext("2d");


var palette = {};
var tiles = new Array();
var clr_wid = 0;
var curtile = -1;
var curcolor = "";
const scale = 30;
var canvas_wid = 16*scale;
var canvas_hei = 16*scale;


function setup()
{
    if (!tiles[curtile]) {
        return;
    }

    canvas_wid = tiles[curtile].wid * scale;
    canvas_hei = tiles[curtile].hei * scale;
    canvas.width = canvas_wid;
    canvas.height = canvas_hei;
    //ctx.setTransform(1, 0, 0, 1, 0, 0); /* reset to defaults */
    //ctx.scale(scale, scale);
    canvas.addEventListener("click", canvas_click_event);
    canvas.addEventListener("mousemove", canvas_mousemove_event);
    canvas.addEventListener("mouseleave", canvas_mouseleave_event);
    document.addEventListener("keydown", handle_keys);
}

function init()
{
    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(event) {
    const reader = new FileReader()
    reader.onload = handleFileLoad;
    reader.readAsText(event.target.files[0])
}

function handleFileLoad(event) {
    var data = event.target.result;
    reset_tiledata();
    nh_parse_text_tiles(data);
}

function reset_tiledata()
{
    palette = {};
    tiles = new Array();
    clr_wid = 0;
    curtile = -1;
    curcolor = "";
}

function nh_parse_text_tiles(data)
{
    var lines = data.split('\n');
    const re_color = /^([\.a-zA-Z0-9]+) *= *(\(([0-9]+), *([0-9]+), *([0-9]+)\)) *$/;
    const re_tilename = /^# tile ([0-9]+) \((.+)\)$/;
    const re_tiledata = /^  ([\.a-zA-Z0-9]+)$/;
    var in_tile = 0;
    var tilename = "";
    var tilenum = -1;
    var tiledata = {};
    var tilehei = 0;
    var tilewid = 0;
    var tileidx = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!in_tile && line.match(re_color)) {
            var m = line.match(re_color);
            palette[m[1]] = { color: "rgb" + m[2] };
            curcolor = m[1];
            if (!clr_wid) {
                clr_wid = m[1].length;
            } else if (clr_wid != m[1].length) {
                alert("ERROR: color key '" + m[1] + "' is different length from earlier keys.");
            }
        } else if (!in_tile && line.match(re_tilename)) {
            var m = line.match(re_tilename);
            tilenum = m[1];
            tilename = m[2];
            if (tilenum < tiles.length) {
                alert("ERROR: Tile #" + tilenum + " already exists.");
            }
        } else if (!in_tile && line == "{") {
            in_tile = 1;
        } else if (in_tile && line.match(re_tiledata)) {
            var m = line.match(re_tiledata);
            tiledata[tilehei] = m[1];
            tilehei = tilehei + 1;
            if (!tilewid) {
                if ((m[1].length % clr_wid)) {
                    alert("ERROR: tiledata for tile #" + tilenum + "(" + tilename + ") is not even with palette width");
                }
                tilewid = parseInt("" + (m[1].length / clr_wid));
            }
        } else if (in_tile && line == "}") {
            if (tilenum == -1) {
                alert("ERROR: no tile number?");
            }
            if (tileidx != tilenum) {
                console.log("WARNING: tile number does not match actual tile order");
            }
            tileidx = tileidx + 1;

            tiles.push({ wid: tilewid, hei: tilehei, name: tilename, data: tiledata });
            in_tile = 0;
            tilenum = -1;
            tilehei = 0;
            tilewid = 0;
            tilename = "";
            tiledata = {};
        }
    }
    curtile = 0;
    setup();
    change_drawing_color(curcolor);
    create_tile_selector();
    create_color_picker();
    show_tile_code(curtile);
    draw();
}

function canvas_click_event()
{
    var left = canvas.offsetLeft + canvas.clientLeft;
    var top = canvas.offsetTop + canvas.clientTop;

    var x = event.pageX - left;
    var y = event.pageY - top;

    var tx = parseInt("" + (x / scale));
    var ty = parseInt("" + (y / scale));

    tile_setpixel(tx, ty, tiles[curtile], curcolor);
    drawtile_pixel(0, 0, tx, ty, tiles[curtile]);
    //drawtile(0, 0, curtile);

    console.log("CLICK("+tx+","+ty+")");
}

var cursor_x = -1;
var cursor_y = -1;

function canvas_mouseleave_event()
{
    if (cursor_x >= 0) {
        drawtile_pixel(0, 0, cursor_x, cursor_y, tiles[curtile]);
    }
    cursor_x = cursor_y = -1;
}

function canvas_mousemove_event()
{
    var left = canvas.offsetLeft + canvas.clientLeft;
    var top = canvas.offsetTop + canvas.clientTop;

    var x = event.pageX - left;
    var y = event.pageY - top;

    var tx = parseInt("" + (x / scale));
    var ty = parseInt("" + (y / scale));

    if (cursor_x >= 0) {
        drawtile_pixel(0, 0, cursor_x, cursor_y, tiles[curtile]);
    }
    cursor_x = tx;
    cursor_y = ty;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.globalCompositeOperation = "xor";
    ctx.rect((cursor_x*scale) + 1, (cursor_y*scale) + 1, scale - 3, scale - 3);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    console.log("MOUSEMOVE("+tx+","+ty+")");
}

function change_drawing_color(newclr)
{
    if (!palette[newclr]) {
        console.log("WARNING: color '" + newclr + "' is not defined.");
        return;
    }
    curcolor = newclr;

    var e = document.getElementById("current-color");
    e.style.backgroundColor = palette[newclr].color;
    ctx.fillStyle = palette[newclr].color;
}

function tile_select()
{
    var sel = document.getElementById("tile-selector");
    curtile = sel.options[sel.selectedIndex].value;
    draw();
}

function create_tile_selector()
{
    var sel = document.getElementById("tile-selector");
    sel.innerHTML = '';
    sel.size = 20;
    sel.addEventListener("change", tile_select);
    for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        var el = document.createElement("option");
        el.textContent = t.name;
        el.value = i;
        sel.appendChild(el);
    }
}

function color_select()
{
    var e = event.target;
    var key = e.getAttribute("data-palette-key");
    change_drawing_color(key);
}

function create_color_picker()
{
    var picker = document.getElementById("color-picker");
    picker.innerHTML = '';

    for (let key in palette) {
        var clr = palette[key];
        var el = document.createElement("span");
        el.className = "color";
        el.setAttribute("data-palette-key", key);
        el.addEventListener("click", color_select);
        el.style.backgroundColor = clr.color;
        picker.appendChild(el);
    }
}

function tile_setpixel(tx, ty, tile, val)
{
    var val = tile.data[ty].substr(0, tx * clr_wid) + val + tile.data[ty].substr(tx+clr_wid);
    tile.data[ty] = val;
    show_tile_code(curtile);
}

function tile_getpixel(tx, ty, tile)
{
    return tile.data[ty].substr(tx * clr_wid, clr_wid);
}

function drawtile_pixel(x,y, tx,ty, tile)
{
    if (tx < 0 || ty < 0 || tx >= tile.wid || ty >= tile.hei) {
        console.log("Trying to drawtile_pixel ("+tx+","+ty+")");
        return;
    }
    var clrkey = tile.data[ty].substr(tx * clr_wid, clr_wid);
    ctx.fillStyle = palette[clrkey].color;
    ctx.fillRect(x + tx*scale, y + ty*scale, scale, scale);
}

function drawtile(x, y, tilenum)
{
    if (tilenum < 0 || tilenum >= tiles.length) {
        return;
    }
    var tile = tiles[tilenum];
    var tx, ty;

    for (ty = 0; ty < tile.hei; ty++) {
        for (tx = 0; tx < tile.wid; tx++) {
            drawtile_pixel(x,y, tx,ty, tile);
        }
    }
}

function draw()
{
    drawtile(0, 0, curtile);
}

function show_tile_code(tilenum)
{
    var e = document.getElementById("show-tile-format");
    var ty;
    var tile = tiles[tilenum];

    var s = "# tile XXX (something)\n";
    s += "{\n";
    for (ty = 0; ty < tile.hei; ty++) {
        s += "  " + tile.data[ty] + "\n";
    }
    s += "}\n";

    e.textContent = s;
}

function handle_keys()
{
    if (event.defaultPrevented) {
        return;
    }

    switch (event.key) {
    case ".":
        if (cursor_x >= 0) {
            change_drawing_color(tile_getpixel(cursor_x, cursor_y, tiles[curtile]));
        }
        break;
    default: return;
    }

    event.preventDefault();
}
