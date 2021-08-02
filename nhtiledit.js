
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
var canvas_update = 1;
var preview_direction = 0;
var fileinput_name = "";
var drawmode = "draw";
var clipboard = null;
var clippings = new Array();
var clippings_idx = 0;
var sel_rect = { x1: -1, y1: -1, x2: -1, y2: -1 };

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
# tile 1 (vertical wall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
}
# tile 2 (horizontal wall)
{
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  ................
  ................
  ................
  ................
  ................
  ................
  ................
}
# tile 3 (top left corner wall)
{
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  .......KKKKKKKKK
  .......KKKKKKKKK
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
}
# tile 4 (top right corner wall)
{
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  KKKKKKKKK.......
  KKKKKKKKK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
}
# tile 5 (bottom left corner wall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KKKKKKKKK
  .......KKKKKKKKK
  ................
  ................
  ................
  ................
  ................
  ................
  ................
}
# tile 6 (bottom right corner wall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  KKKKKKKKK.......
  KKKKKKKKK.......
  ................
  ................
  ................
  ................
  ................
  ................
  ................
}
# tile 7 (cross wall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
}
# tile 8 (tuwall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  ................
  ................
  ................
  ................
  ................
  ................
  ................
}
# tile 9 (tdwall)
{
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
}
# tile 10 (tlwall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  KKKKKKKKK.......
  KKKKKKKKK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
}
# tile 11 (trwall)
{
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KKKKKKKKK
  .......KKKKKKKKK
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
  .......KK.......
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

            tmp_tiles.push({ wid: tilewid, hei: tilehei, name: tilename, data: tiledata, undo: new Array(), selection: new Array() });
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
    set_drawmode(drawmode);
    change_drawing_color(curcolor);
    create_tile_selector();
    create_color_picker();
    show_tile_code(curtile);
    setup_preview(-1, -1);
    tile_update(tiles[0]);
    show_preview_dir();
    show_clipboard();
}

function set_current_tile(tilenum)
{
    curtile = tilenum;
    tile_update(tiles[curtile]);
    var sel = document.getElementById("tile-selector");
    sel.options[curtile].selected = 'selected';
}

function preview_tile_click_event()
{
    var x = this.getAttribute("data-x");
    var y = this.getAttribute("data-y");

    if (preview_direction == 0) {
        if (!tiles[curtile].image)
            tiles[curtile].image = get_tile_image(tiles[curtile]);

        preview.data[y][x] = curtile;
        preview.img[y][x].src = tiles[curtile].image.src;
    } else if (curtile != preview.data[y][x]) {
        set_current_tile(preview.data[y][x]);
    }
}

function setup_preview(wid, hei)
{
    var e = document.getElementById("preview");
    var ptiles = new Array();
    var x, y;
    var images = new Array();
    var op = preview;

    if (wid < 0) {
        if (preview)
            wid = preview.w;
        else
            wid = 7;
    }
    if (hei < 0) {
        if (preview)
            hei = preview.h;
        else
            hei = 7;
    }
    e.innerHTML = '';

    for (y = 0; y < hei; y++) {
        ptiles[y] = new Array();
        images[y] = new Array();
        for (x = 0; x < wid; x++) {
            if (op && y < op.h && x < op.w)
                ptiles[y][x] = op.data[y][x];
            else
                ptiles[y][x] = curtile;
            images[y][x] = new Image();
            var spn = document.createElement("span");
            spn.setAttribute("data-x", x);
            spn.setAttribute("data-y", y);
            spn.addEventListener("click", preview_tile_click_event);
            spn.appendChild(images[y][x]);
            e.appendChild(spn);
        }
        e.appendChild(document.createElement("br"));
    }

    preview = null;
    op = null;
    preview = { w: wid, h: hei, data: ptiles, elem: e, img: images };
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

            p.img[y][x].setAttribute("title", tile.name);
            p.img[y][x].src = tile.image.src;
        }
    }
}

function generate_preview(style)
{
    var x, y;
    var p = preview;

    if (!preview)
        return;

    switch (style) {
    case "randomize":
        for (y = 0; y < p.h; y++) {
            for (x = 0; x < p.w; x++) {
                p.data[y][x] = Math.floor(Math.random() * tiles.length);
            }
        }
        update_preview();
        break;
    case "order":
        var i = 0;
        for (y = 0; y < p.h; y++) {
            for (x = 0; x < p.w; x++) {
                p.data[y][x] = ((curtile + i) % tiles.length);
                i = i + 1;
            }
        }
        update_preview();
        break;
    case "walls":
        var t = curtile;
        if (!tiles[curtile].name.match(/wall/)) {
            for (t = 0; t < tiles.length; t++)
                if (tiles[t].name.match(/wall/))
                    break;
            if (t == tiles.length) {
                alert("Wall tiles not found.");
                break;
            }
            t = (t % tiles.length);
        }
        var offsets = [
            [  2,  1,  1,  8,  1,  1,  3 ],
            [  0, -1, -1,  0, -1, -1,  0 ],
            [  0, -1, -1,  0, -1, -1,  0 ],
            [ 10,  1,  1,  6,  1,  1,  9 ],
            [  0, -1, -1,  0, -1, -1,  0 ],
            [  0, -1, -1,  0, -1, -1,  0 ],
            [  4,  1,  1,  7,  1,  1,  5 ],
        ];
        var x, y;
        if (preview.h < 7 || preview.w < 7)
            setup_preview(7, 7);
        for (y = 0; y < preview.h; y++) {
            for (x = 0; x < preview.w; x++) {
                if (offsets[y][x] >= 0)
                    preview.data[y][x] = t + offsets[y][x];
            }
        }
        update_preview();
        break;
    default: break;
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

    if (drawmode == "selection") {
        if (sel_rect.x1 > -1) {
            sel_rect.x1 = sel_rect.y1 = -1;
        } else {
            draw_selection(tiles[curtile], 1);
            selection_toggle(tiles[curtile], tx, ty);
            draw_selection(tiles[curtile]);
        }
    } else if (drawmode == "draw") {
        if (clipboard) {
            paste_clipboard(clipboard, cursor_x, cursor_y)
            draw_clipboard(tx, ty, clipboard, 0);
        } else {
            tile_setpixel(tx, ty, tiles[curtile], curcolor);
            drawtile_pixel(0, 0, tx, ty, tiles[curtile]);
        }
    }
    draw_cursor(tx, ty);
    //console.log("CLICK("+tx+","+ty+")");
}

var cursor_x = -1;
var cursor_y = -1;

function canvas_mouseleave_event()
{
    if (cursor_x >= 0) {
        drawtile_pixel(0, 0, cursor_x, cursor_y, tiles[curtile]);
        if (drawmode == "draw")
            draw_clipboard(cursor_x, cursor_y, clipboard, 1);
    }
    cursor_x = cursor_y = -1;
}

function draw_cursor(tx, ty)
{
    if (cursor_x >= 0) {
        drawtile_pixel(0, 0, cursor_x, cursor_y, tiles[curtile]);
        draw_clipboard(cursor_x, cursor_y, clipboard, 1);
    }
    cursor_x = tx;
    cursor_y = ty;

    if (drawmode == "draw")
        draw_clipboard(cursor_x, cursor_y, clipboard, 0);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(255, 0, 255)";
    ctx.globalCompositeOperation = "difference";
    ctx.rect((cursor_x*scale) + 1, (cursor_y*scale) + 1, scale - 2, scale - 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
}

function draw_selection(tile, erase)
{
    if (tile.selection && tile.selection.length > 0) {
        for (var i = 0; i < tile.selection.length; i++) {
            var x = tile.selection[i].x, y = tile.selection[i].y;
            if (erase) {
                drawtile_pixel(0, 0, x, y, tile);
            } else {
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = "rgb(0, 255, 255)";
                ctx.globalCompositeOperation = "difference";
                ctx.rect((x*scale) + 1, (y*scale) + 1, scale - 2, scale - 2);
                ctx.stroke();
                ctx.globalCompositeOperation = "source-over";
            }
        }
    }
}

function selection_add(tile, tx, ty)
{
    for (var i = 0; i < tile.selection.length; i++) {
        if (tile.selection[i].x == tx && tile.selection[i].y == ty)
            return;
    }
    tile.selection.push({ x: tx, y: ty });
}

function selection_toggle(tile, tx, ty)
{
    for (var i = 0; i < tile.selection.length; i++) {
        if (tile.selection[i].x == tx && tile.selection[i].y == ty) {
            tile.selection.splice(i, 1);
            return;
        }
    }
    tile.selection.push({ x: tx, y: ty });
}

function selection_remove(tile, tx, ty)
{
    for (var i = 0; i < tile.selection.length; i++) {
        if (tile.selection[i].x == tx && tile.selection[i].y == ty) {
            tile.selection.splice(i, 1);
            return;
        }
    }
}

function selection_getdata(tile)
{
    var tmp = new Array();
    var i;
    var minx = tile.wid, miny = tile.hei;
    var maxx = 0, maxy = 0;
    var centerx, centery;

    for (var i = 0; i < tile.selection.length; i++) {
        var tx = tile.selection[i].x, ty = tile.selection[i].y;
        tmp.push({ x: tx, y: ty, pixel: tile_getpixel(tx, ty, tile) });
        if (tx < minx) minx = tx;
        if (ty < miny) miny = ty;
        if (tx > maxx) maxx = tx;
        if (ty > maxy) maxy = ty;
    }

    centerx = parseInt((maxx - minx)/2) + minx;
    centery = parseInt((maxy - miny)/2) + miny;

    if (tmp && tmp.length > 0)
        return { cx: centerx, cy: centery, data: tmp };
    return null;
}

function draw_clipboard(tx, ty, paste, erase)
{
    if (!paste || !paste.data)
        return;

    var i;
    var tile = tiles[curtile];
    var data = paste.data;

    for (var i = 0; i < data.length; i++) {
        var x = (data[i].x + tx - paste.cx), y = (data[i].y + ty - paste.cy);
        if (x >= 0 && y >= 0 && x < tile.wid && y < tile.hei) {
            if (erase) {
                drawtile_pixel(0, 0, x, y, tile);
            } else {
                ctx.globalAlpha = 0.25;
                draw_pixel(x, y, data[i].pixel);
                ctx.globalAlpha = 1.0;
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = "rgb(255, 255, 0)";
                ctx.globalCompositeOperation = "difference";
                ctx.rect((x*scale) + 1, (y*scale) + 1, scale - 2, scale - 2);
                ctx.stroke();
                ctx.globalCompositeOperation = "source-over";
            }
        }
    }
}

function paste_clipboard(paste, dx, dy)
{
    var i;
    var changed = 0;
    var multiple = new Array();
    var tile = tiles[curtile];
    var data = paste.data;

    if (!data)
        return;

    canvas_update = 0;
    for (var i = 0; i < data.length; i++) {
        var tx = (data[i].x + dx - paste.cx), ty = (data[i].y + dy - paste.cy);
        if (tx >= 0 && ty >= 0 && tx < tile.wid && ty < tile.hei) {
            var fromclr = tile_getpixel(tx, ty, tile);
            if (fromclr != data[i].pixel) {
                tile_setpixel(tx, ty, tile, data[i].pixel);
                multiple.push(tile.undo.pop());
                changed = 1;
            }
        }
    }

    canvas_update = 1;
    if (changed) {
        tile.undo.push({ multi: multiple });
        tile_update(tile);
    }
}

function canvas_mousemove_event()
{
    var left = canvas.offsetLeft + canvas.clientLeft;
    var top = canvas.offsetTop + canvas.clientTop;

    var x = event.pageX - left;
    var y = event.pageY - top;

    var tx = parseInt("" + (x / scale));
    var ty = parseInt("" + (y / scale));

    if (sel_rect.x1 > -1 && drawmode == "selection") {
        var sx, sy;
        draw_selection(tiles[curtile], 1);
        if (cursor_x >= 0) {
            for (sx = Math.min(sel_rect.x1, cursor_x); sx <= Math.max(sel_rect.x1, cursor_x); sx++) {
                for (sy = Math.min(sel_rect.y1, cursor_y); sy <= Math.max(sel_rect.y1, cursor_y); sy++) {
                    selection_remove(tiles[curtile], sx, sy);
                }
            }
        }

        for (sx = Math.min(sel_rect.x1, tx); sx <= Math.max(sel_rect.x1, tx); sx++) {
            for (sy = Math.min(sel_rect.y1, ty); sy <= Math.max(sel_rect.y1, ty); sy++) {
                selection_add(tiles[curtile], sx, sy);
            }
        }
    }

    draw_cursor(tx, ty);

    if (drawmode == "selection") {
        draw_selection(tiles[curtile]);
    }
    if (clipboard && drawmode == "draw") {
        draw_clipboard(tx, ty, clipboard, 0);
    }
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
    curtile = parseInt(sel.options[sel.selectedIndex].value);
    tile_update(tiles[curtile]);
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

function tile_update(tile)
{
    tile.image = get_tile_image(tile);
    drawtile(0, 0, curtile);
    if (drawmode != "selection") {
        draw_selection(tile, 1);
    } else {
        draw_selection(tile);
    }

    show_tile_code(curtile);
    update_preview();
    if (drawmode == "draw") {
        if (clipboard && cursor_x >= 0) {
            draw_clipboard(cursor_x, cursor_y, clipboard, 0);
        }
    } else {
        if (clipboard && cursor_x >= 0) {
            draw_clipboard(cursor_x, cursor_y, clipboard, 1);
        }
    }
    if (cursor_x >= 0)
        draw_cursor(cursor_x, cursor_y);
}

function tile_setpixel(tx, ty, tile, val)
{
    var origval = tile.data[ty].substring(tx*clr_wid, (tx*clr_wid) + clr_wid);
    if (origval == val)
        return;

    tile.undo.push({ x: tx, y: ty, oval: origval });
    var val = tile.data[ty].substr(0, tx * clr_wid) + val + tile.data[ty].substr((tx*clr_wid) + clr_wid);
    tile.data[ty] = val;
    if (canvas_update) {
        tile_update(tile);
    }
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

function draw_pixel(tx,ty, clrkey)
{
    ctx.fillStyle = palette[clrkey].color;
    ctx.fillRect(tx*scale, ty*scale, scale, scale);
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

function tile_undo(tilenum)
{
    var tile = tiles[tilenum];
    if (!tile.undo || tile.undo.length < 1) {
        return;
    }
    var u = tile.undo.pop();
    if (u.multi) {
        /* multiple pixels changed */
        canvas_update = 0;
        for (var i = 0; i < u.multi.length; i++) {
            tile_setpixel(u.multi[i].x, u.multi[i].y, tile, u.multi[i].oval);
            //drawtile_pixel(0, 0, u.multi[i].x, u.multi[i].y, tile);
            tile.undo.pop(); /* remove the undo we just caused via tile_setpixel */
        }
        canvas_update = 1;
        tile_update(tile);
    } else {
        /* single pixel changed */
        tile_setpixel(u.x, u.y, tile, u.oval);
        drawtile_pixel(0, 0, u.x, u.y, tile);
        tile.undo.pop(); /* remove the undo we just caused via tile_setpixel */
        tile_update(tile);
    }
}

function show_tile_code(tilenum)
{
    var e = document.getElementById("show-tile-format");
    var ty;
    var tile = tiles[tilenum];
    var edited = "";
    if (tile.undo && tile.undo.length > 0)
        edited = "edited ";

    var s = "# tile " + tilenum + " (" + edited + tile.name + ")\n";
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

    canvas_update = 0;
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

    canvas_update = 1;
    if (changed) {
        tile.undo.push({ multi: multiple });
        tile_update(tile);
    }
}

function show_preview_dir()
{
    var e = document.getElementById("preview-direction");
    if (preview_direction == 0)
        e.innerHTML = "=>";
    else
        e.innerHTML = "<=";
}

function change_preview_dir()
{
    preview_direction = (preview_direction + 1) % 2;
    show_preview_dir();
}

function set_drawmode(mode)
{
    var e = document.getElementById("drawmode");
    e.innerHTML = mode;
    drawmode = mode;
    tile_update(tiles[curtile]);
}

function show_clipboard()
{
    var e = document.getElementById("clipboard");
    var c = "none";
    var l = "";

    if (clipboard)
        c = (clippings_idx + 1);
    if (clippings.length > 0)
        l = "/" + clippings.length;
    e.innerHTML = "clip:" + c + l;
}

function handle_keys()
{
    if (event.defaultPrevented) {
        return;
    }

    switch (event.key) {
    case ".": /* color picker */
        if (drawmode == "draw" && cursor_x >= 0) {
            change_drawing_color(tile_getpixel(cursor_x, cursor_y, tiles[curtile]));
        }
        break;
    case "u": /* undo */
        if (drawmode == "draw")
            tile_undo(curtile);
        break;
    case "r": /* replace all pixels of (color under curse) with current color */
        if (drawmode == "draw" && cursor_x >= 0) {
            tile_replace_color(curtile, tile_getpixel(cursor_x, cursor_y, tiles[curtile]), curcolor);
        }
        break;
    case "-": /* edit or pickup preview tile */
        change_preview_dir();
        break;
    case "1": /* randomize preview */
        generate_preview("randomize");
        break;
    case "2": /* order preview */
        generate_preview("order");
        break;
    case "3": /* wall sampler preview */
        generate_preview("walls");
        break;
    case "8": /* decrease selection width */
        setup_preview(Math.max(3, preview.w - 1), preview.h);
        update_preview();
        break;
    case "9": /* increase selection width */
        setup_preview(Math.min(40, preview.w + 1), preview.h);
        update_preview();
        break;
    case "m": /* toggle between draw and selection mode */
        if (drawmode == "selection") {
            set_drawmode("draw");
            tile_update(tiles[curtile]);
        } else {
            set_drawmode("selection");
            tile_update(tiles[curtile]);
        }
        break;
    case "c": /* add selection as new clipping, change to draw mode */
        if (drawmode == "selection") {
            if (clipboard && cursor_x >= 0) {
                draw_clipboard(cursor_x, cursor_y, clipboard, 1);
            }
            clipboard = selection_getdata(tiles[curtile]);
            if (clipboard) {
                clippings.push(clipboard);
                clippings_idx = clippings.length-1;
                set_drawmode("draw");
                tile_update(tiles[curtile]);
                show_clipboard();
            }
        }
        break;
    case "v": /* paste current clipping into tile */
        if (drawmode == "draw" && clipboard && cursor_x >= 0) {
            paste_clipboard(clipboard, cursor_x, cursor_y)
        }
        break;
    case "z": /* toggle between clipping and pixel drawing */
        if (drawmode == "draw" && cursor_x >= 0) {
            if (clipboard) {
                draw_clipboard(cursor_x, cursor_y, clipboard, 1);
                clipboard = null;
            } else {
                if (clippings_idx >= 0 && clippings_idx < clippings.length) {
                    clipboard = clippings[clippings_idx];
                    draw_clipboard(cursor_x, cursor_y, clipboard);
                }
            }
            show_clipboard();
        }
        break;
    case "s": /* next clipping */
        if (drawmode == "draw") {
            if (clipboard && cursor_x >= 0) {
                draw_clipboard(cursor_x, cursor_y, clipboard, 1);
            }
            clippings_idx = (clippings_idx + 1) % clippings.length;
            clipboard = null;
            clipboard = clippings[clippings_idx];
            if (clipboard && cursor_x >= 0)
                draw_clipboard(cursor_x, cursor_y, clipboard);
            show_clipboard();
        }
        break;
    case "a": /* previous clipping */
        if (drawmode == "draw") {
            if (clipboard && cursor_x >= 0) {
                draw_clipboard(cursor_x, cursor_y, clipboard, 1);
            }
            if (clippings_idx < 1)
                clippings_idx = clippings.length - 1;
            else
                clippings_idx = (clippings_idx - 1) % clippings.length;
            clipboard = null;
            clipboard = clippings[clippings_idx];
            if (clipboard && cursor_x >= 0)
                draw_clipboard(cursor_x, cursor_y, clipboard);
            show_clipboard();
        }
        break;
    case "Delete": /* delete current clipping */
        if (drawmode == "draw") {
            if (clipboard && cursor_x >= 0) {
                draw_clipboard(cursor_x, cursor_y, clipboard, 1);
                if (clippings.length > 0) {
                    clippings.splice(clippings_idx, 1);
                    clippings_idx--;
                    if (clippings_idx < 0)
                        clippings_idx = clippings.length - 1;
                }
                clipboard = clippings[clippings_idx];
                if (clipboard && cursor_x >= 0)
                    draw_clipboard(cursor_x, cursor_y, clipboard);
                show_clipboard();
            }
        }
        break;
    case "y": /* start selection rectangle */
        if (drawmode == "selection" && cursor_x >= 0) {
            sel_rect.x1 = cursor_x;
            sel_rect.y1 = cursor_y;
        }
        break;
    case "g": /* clear selection */
        if (drawmode == "selection") {
            draw_selection(tiles[curtile], 1);
            tiles[curtile].selection = null;
            tiles[curtile].selection = new Array();
        }
        break;
    case "i": /* invert selection */
        if (drawmode == "selection") {
            draw_selection(tiles[curtile], 1);
            var tx, ty;
            for (tx = 0; tx < tiles[curtile].wid; tx++)
                for (ty = 0; ty < tiles[curtile].hei; ty++)
                    selection_toggle(tiles[curtile], tx, ty);
            draw_selection(tiles[curtile]);
        }
        break;
    case "t": /* toggle selection of all pixels of (color under cursor) */
        if (drawmode == "selection" && cursor_x >= 0) {
            draw_selection(tiles[curtile], 1);
            var tx, ty;
            var clrkey = tile_getpixel(cursor_x, cursor_y, tiles[curtile]);
            for (tx = 0; tx < tiles[curtile].wid; tx++)
                for (ty = 0; ty < tiles[curtile].hei; ty++)
                    if (tile_getpixel(tx, ty, tiles[curtile]) == clrkey)
                        selection_toggle(tiles[curtile], tx, ty);
            draw_selection(tiles[curtile]);
        }
        break;
    case "?": /* toggle help */
        if (window.location.hash == "#help") {
            window.location.hash = "";
        } else {
            window.location.hash = "help";
        }
        break;
    default:
        //console.log("KEY:'"+event.key+"'");
        return;
    }

    event.preventDefault();
}
