
var canvas = document.getElementById("paintarea");
if (!canvas.getContext) {
    alert("Canvas is not supported by your browser.");
    exit;
}
var ctx = canvas.getContext("2d");


var preview;
var palette = {};
var tiles = new Array();
var clr_wid = 0;
var curtile = -1;
var curcolor = "";
const scale = 30;
var canvas_wid = 16*scale;
var canvas_hei = 16*scale;

var default_data = `
. = (71, 108, 108)
A = (0, 0, 0)
B = (0, 182, 255)
C = (255, 108, 0)
D = (255, 0, 0)
E = (0, 0, 255)
F = (0, 145, 0)
G = (108, 255, 0)
H = (255, 255, 0)
I = (255, 0, 255)
J = (145, 71, 0)
K = (204, 79, 0)
L = (255, 182, 145)
M = (237, 237, 237)
N = (255, 255, 255)
O = (215, 215, 215)
P = (108, 145, 182)
Q = (18, 18, 18)
R = (54, 54, 54)
S = (73, 73, 73)
T = (82, 82, 82)
U = (205,205,205)
V = (104, 104, 104)
W = (131, 131, 131)
X = (140, 140, 140)
Y = (149, 149, 149)
Z = (195, 195, 195)
0 = (100, 100, 100)
1 = (72, 108, 108)
# tile 0 (question mark)
{
  ................
  ................
  .....NNNN.......
  ....NNNNNN......
  ...NNAAAANN.....
  ...NNA...NNA....
  ....AA...NNA....
  ........NNAA....
  .......NNAA.....
  ......NNAA......
  ......NNA.......
  .......AA.......
  ......NN........
  ......NNA.......
  .......AA.......
  ................
}
# tile 1 (floor of a room)
{
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  .......PP.......
  .......PP.......
  ................
  ................
  ................
  ................
  ................
  ................
  ................
}
`;


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
    reset_tiledata();
    nh_parse_text_tiles(default_data);
}

function handleFileSelect(event) {
    const reader = new FileReader()
    reader.onload = handleFileLoad;
    reader.readAsText(event.target.files[0])
}

function handleFileLoad(event) {
    var data = event.target.result;
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
    const re_color = /^([_$\.a-zA-Z0-9]+) *= *(\(([0-9]+), *([0-9]+), *([0-9]+)\)) *$/;
    const re_tilename = /^# tile ([0-9]+) \((.+)\)$/;
    const re_tiledata = /^  ([_$\.a-zA-Z0-9]+)$/;
    var in_tile = 0;
    var tilename = "";
    var tilenum = -1;
    var tiledata = {};
    var tilehei = 0;
    var tilewid = 0;
    var tileidx = 0;

    var tmp_palette = {};
    var tmp_tiles = new Array();
    var tmp_clr_wid = 0;
    var tmp_curcolor = "";

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!in_tile && line.match(re_color)) {
            var m = line.match(re_color);
            tmp_palette[m[1]] = { color: "rgb" + m[2] };
            if (tmp_curcolor == "")
                tmp_curcolor = m[1];
            if (!tmp_clr_wid) {
                tmp_clr_wid = m[1].length;
            } else if (tmp_clr_wid != m[1].length) {
                alert("ERROR: color key '" + m[1] + "' is different length from earlier keys.");
            }
        } else if (!in_tile && line.match(re_tilename)) {
            var m = line.match(re_tilename);
            tilenum = m[1];
            tilename = m[2];
            if (tilenum < tmp_tiles.length) {
                console.log("WARNING: Tile #" + tilenum + " already exists.");
            }
        } else if (!in_tile && line == "{") {
            in_tile = 1;
        } else if (in_tile && line.match(re_tiledata)) {
            var m = line.match(re_tiledata);
            tiledata[tilehei] = m[1];
            tilehei = tilehei + 1;
            if (!tilewid) {
                if ((m[1].length % tmp_clr_wid)) {
                    alert("ERROR: tiledata for tile #" + tilenum + "(" + tilename + ") is not even with palette width");
                }
                tilewid = parseInt("" + (m[1].length / tmp_clr_wid));
            }
        } else if (in_tile && line == "}") {
            if (tilenum == -1) {
                alert("ERROR: no tile number?");
            }
            if (tileidx != tilenum) {
                console.log("WARNING: tile number does not match actual tile order");
            }
            tileidx = tileidx + 1;

            tmp_tiles.push({ wid: tilewid, hei: tilehei, name: tilename, data: tiledata, undo: new Array() });
            in_tile = 0;
            tilenum = -1;
            tilehei = 0;
            tilewid = 0;
            tilename = "";
            tiledata = {};
        } else if (line != "") {
            alert("ERROR: Unknown file format.");
            document.getElementById('fileInput').value = null;
            return;
        }
    }

    reset_tiledata();
    palette = tmp_palette;
    tiles = tmp_tiles;
    clr_wid = tmp_clr_wid;
    curcolor = tmp_curcolor;

    curtile = 0;
    setup();
    change_drawing_color(curcolor);
    create_tile_selector();
    create_color_picker();
    show_tile_code(curtile);
    setup_preview(tiles[0].wid, tiles[0].hei);
    draw();
}

function setup_preview(tilewid, tilehei)
{
    var e = document.getElementById("preview");
    var tiles = new Array();
    var x, y;
    const wid = 7;
    const hei = 7;
    var images = new Array();

    e.innerHTML = '';

    for (y = 0; y < hei; y++) {
        tiles[y] = new Array();
        images[y] = new Array();
        for (x = 0; x < wid; x++) {
            tiles[y][x] = 0;
            images[y][x] = new Image();
            var spn = document.createElement("span");
            spn.appendChild(images[y][x]);
            e.appendChild(spn);
        }
        e.appendChild(document.createElement("br"));
    }

    preview = { w: wid, h: hei, data: tiles, elem: e, img: images };
}

function update_preview()
{
    var x, y;
    var tx, ty;

    if (!preview)
        return;

    var p = preview;

    for (y = 0; y < p.h; y++) {
        for (x = 0; x < p.w; x++) {
            var tilenum = p.data[y][x];
            if (!tiles[tilenum])
                tilenum = 0;
            var tile = tiles[tilenum];

            if (!tile.image)
                tile.image = get_tile_image(tile);

            p.img[y][x].src = tile.image.src;
        }
    }
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
    draw_cursor(tx, ty);

    //console.log("CLICK("+tx+","+ty+")");
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

function draw_cursor(tx, ty)
{
    if (cursor_x >= 0) {
        drawtile_pixel(0, 0, cursor_x, cursor_y, tiles[curtile]);
    }
    cursor_x = tx;
    cursor_y = ty;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(255, 0, 255)";
    ctx.globalCompositeOperation = "difference";
    ctx.rect((cursor_x*scale) + 1, (cursor_y*scale) + 1, scale - 2, scale - 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
}

function canvas_mousemove_event()
{
    var left = canvas.offsetLeft + canvas.clientLeft;
    var top = canvas.offsetTop + canvas.clientTop;

    var x = event.pageX - left;
    var y = event.pageY - top;

    var tx = parseInt("" + (x / scale));
    var ty = parseInt("" + (y / scale));

    draw_cursor(tx, ty);

    //console.log("MOUSEMOVE("+tx+","+ty+")");
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
    sel.size = Math.min(20, tiles.length);
    for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        var el = document.createElement("option");
        el.textContent = t.name;
        el.value = i;
        sel.appendChild(el);
    }
    sel.options[0].selected = 'selected';
    sel.addEventListener("change", tile_select);
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

function get_tile_image(tile)
{
    var e = document.createElement("canvas");
    var c = e.getContext("2d");
    var tx, ty;
    var durl;
    e.width = tile.wid;
    e.height = tile.hei;

    for (ty = 0; ty < tile.hei; ty++) {
        for (tx = 0; tx < tile.wid; tx++) {
            var clrkey = tile.data[ty].substr(tx * clr_wid, clr_wid);
            c.fillStyle = palette[clrkey].color;
            c.fillRect(tx, ty, 1, 1);
        }
    }
    var img = new Image(tile.wid, tile.hei);
    img.crossOrigin = 'Anonymous';
    img.src = e.toDataURL("image/png");
    c = null;
    e = null;
    return img;
}

function tile_setpixel(tx, ty, tile, val)
{
    var origval = tile.data[ty].slice(tx, tx + clr_wid);
    if (origval == val)
        return;

    tile.undo.push({ x: tx, y: ty, oval: origval });
    var val = tile.data[ty].substr(0, tx * clr_wid) + val + tile.data[ty].substr(tx+clr_wid);
    tile.data[ty] = val;
    tile.image = get_tile_image(tile);
    show_tile_code(curtile);
    update_preview();
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
    show_tile_code(curtile);
    update_preview();
}

function tile_undo(tilenum)
{
    var tile = tiles[tilenum];
    if (!tile.undo || tile.undo.length < 1) {
        return;
    }
    var u = tile.undo.pop();
    if (u.multi) {
        /* multiple pixels changed */
        for (var i = 0; i < u.multi.length; i++) {
            tile_setpixel(u.multi[i].x, u.multi[i].y, tile, u.multi[i].oval);
            drawtile_pixel(0, 0, u.multi[i].x, u.multi[i].y, tile);
            tile.undo.pop(); /* remove the undo we just caused via tile_setpixel */
        }
    } else {
        /* single pixel changed */
        tile_setpixel(u.x, u.y, tile, u.oval);
        drawtile_pixel(0, 0, u.x, u.y, tile);
        tile.undo.pop(); /* remove the undo we just caused via tile_setpixel */
    }
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

/* replace all colors */
function tile_replace_color(tilenum, fromclr, toclr)
{
    var tile = tiles[tilenum];
    var tx, ty;
    var changed = 0;
    var multiple = new Array();

    if (fromclr == toclr)
        return;

    for (ty = 0; ty < tile.hei; ty++) {
        for (tx = 0; tx < tile.wid; tx++) {
            var val = tile_getpixel(tx, ty, tile);
            if (val == fromclr) {
                tile_setpixel(tx,ty, tile, toclr);
                multiple.push(tile.undo.pop());
                changed = 1;
            }
        }
    }

    if (changed) {
        tile.undo.push({ multi: multiple });
        draw();
    }
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
    case "u":
        tile_undo(curtile);
        break;
    case "r":
        if (cursor_x >= 0) {
            tile_replace_color(curtile, tile_getpixel(cursor_x, cursor_y, tiles[curtile]), curcolor);
        }
        break;
    default: return;
    }

    event.preventDefault();
}
