
var canvas = document.getElementById("paintarea");
if (!canvas.getContext) {
    alert("Canvas is not supported by your browser.");
    exit;
}
var ctx = canvas.getContext("2d");

function Tile(width, height, tilenumber, tilename, tiledata)
{
    this.wid = width;
    this.hei = height;
    this.tilenum = tilenumber;
    this.name = tilename;
    this.data = tiledata;
    this._undo = new Array();
    this.selection = new Array();
    this.image = null;

    this.setpixel = function(tx, ty, val)
    {
        var origval = this.getpixel(tx, ty);
        if (origval == val)
            return;

        this._undo.push({ x: tx, y: ty, oval: origval });
        var val = this.data[ty].substr(0, tx * clr_wid) + val + this.data[ty].substr((tx*clr_wid) + clr_wid);
        this.data[ty] = val;
        if (canvas_update) {
            this.update();
        }
    }

    this.getpixel = function(tx, ty)
    {
        return this.data[ty].substr(tx * clr_wid, clr_wid);
    }

    this.draw_pixel = function(tx,ty)
    {
        if (tx < 0 || ty < 0 || tx >= this.wid || ty >= this.hei) {
            console.log("Trying to draw_pixel("+tx+","+ty+")");
            return;
        }
        var clrkey = this.getpixel(tx, ty);
        ctx.fillStyle = palette[clrkey].color;
        ctx.fillRect(tx*scale, ty*scale, scale, scale);
    }

    this.draw = function()
    {
        for (var ty = 0; ty < this.hei; ty++) {
            for (var tx = 0; tx < this.wid; tx++) {
                this.draw_pixel(tx,ty);
            }
        }
    }

    this.undo = function()
    {
        if (!this._undo || this._undo.length < 1)
            return;
        var u = this._undo.pop();
        if (u.multi) {
            /* multiple pixels changed */
            canvas_update = 0;
            for (var i = 0; i < u.multi.length; i++) {
                this.setpixel(u.multi[i].x, u.multi[i].y, u.multi[i].oval);
                this._undo.pop(); /* remove the undo we just caused via tile_setpixel */
            }
            canvas_update = 1;
            this.update();
        } else {
            /* single pixel changed */
            this.setpixel(u.x, u.y, u.oval);
            this.draw_pixel(u.x, u.y);
            this._undo.pop(); /* remove the undo we just caused via tile_setpixel */
            this.update();
        }
    }

    this.get_code = function(showedited)
    {
        var ty;
        var edited = "";
        if (showedited && this._undo && this._undo.length > 0)
            edited = "edited ";

        var s = "# tile " + this.tilenum + " (" + edited + this.name + ")\n";
        s += "{\n";
        for (ty = 0; ty < this.hei; ty++) {
            s += "  " + this.data[ty] + "\n";
        }
        s += "}\n";
        return s;
    }

    this.update = function()
    {
        this.update_image();
        this.draw();
        if (drawmode != "selection") {
            this.selection_draw(1);
        } else {
            this.selection_draw();
        }

        show_tile_code(this);
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

    this.get_image = function()
    {
        if (!this.image)
            this.update_image();
        return this.image.src;
    }

    this.update_image = function()
    {
        var e = document.createElement("canvas");
        var c = e.getContext("2d");
        var tx, ty;
        var durl;
        e.width = this.wid;
        e.height = this.hei;

        for (ty = 0; ty < this.hei; ty++) {
            for (tx = 0; tx < this.wid; tx++) {
                var clrkey = this.data[ty].substr(tx * clr_wid, clr_wid);
                c.fillStyle = palette[clrkey].color;
                c.fillRect(tx, ty, 1, 1);
            }
        }
        var img = new Image(this.wid, this.hei);
        img.crossOrigin = 'Anonymous';
        img.src = e.toDataURL("image/png");
        c = null;
        e = null;
        this.image = img;
    }

    this.replace_color = function(fromclr, toclr)
    {
        var tx, ty;
        var changed = 0;
        var multiple = new Array();

        if (fromclr == toclr)
            return;

        canvas_update = 0;
        for (ty = 0; ty < this.hei; ty++) {
            for (tx = 0; tx < this.wid; tx++) {
                var val = this.getpixel(tx, ty);
                if (val == fromclr) {
                    this.setpixel(tx,ty, toclr);
                    multiple.push(this._undo.pop());
                    changed = 1;
                }
            }
        }

        canvas_update = 1;
        if (changed) {
            this._undo.push({ multi: multiple });
            this.update();
        }
    }

    this.selection_add = function(tx, ty)
    {
        for (var i = 0; i < this.selection.length; i++)
            if (this.selection[i].x == tx && this.selection[i].y == ty) {
                return;
            }
        this.selection.push({ x: tx, y: ty });
    }

    this.selection_toggle = function(tx, ty)
    {
        for (var i = 0; i < this.selection.length; i++)
            if (this.selection[i].x == tx && this.selection[i].y == ty) {
                this.selection.splice(i, 1);
                return;
            }
        this.selection.push({ x: tx, y: ty });
    }

    this.selection_remove = function(tx, ty)
    {
        for (var i = 0; i < this.selection.length; i++)
            if (this.selection[i].x == tx && this.selection[i].y == ty) {
                this.selection.splice(i, 1);
                return;
            }
    }

    this.selection_getdata = function()
    {
        var tmp = new Array();
        var i;
        var minx = this.wid, miny = this.hei;
        var maxx = 0, maxy = 0;
        var centerx, centery;

        for (var i = 0; i < this.selection.length; i++) {
            var tx = this.selection[i].x, ty = this.selection[i].y;
            tmp.push({ x: tx, y: ty, pixel: this.getpixel(tx, ty) });
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

    this.selection_draw = function(erase)
    {
        if (this.selection && this.selection.length > 0) {
            for (var i = 0; i < this.selection.length; i++) {
                var x = this.selection[i].x, y = this.selection[i].y;
                if (erase) {
                    this.draw_pixel(x, y);
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

}


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
var prev_walls = -1;
var prev_explosion = -1;
var preview_disable = {};

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

            tmp_tiles.push(new Tile(tilewid, tilehei, tileidx, tilename, tiledata));
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

    prev_walls = -1;
    prev_explosion = -1;
    preview_disable = {};

    curtile = 0;
    setup();
    set_drawmode(drawmode);
    change_drawing_color(curcolor);
    create_tile_selector();
    create_color_picker();
    show_tile_code(tiles[curtile]);
    setup_preview(-1, -1);
    tiles[0].update();
    show_preview_dir();
    show_clipboard();
    show_tile_download();
}

function set_current_tile(tilenum)
{
    curtile = tilenum;
    tiles[curtile].update();
    var sel = document.getElementById("tile-selector");
    sel.options[curtile].selected = 'selected';
}

function preview_tile_click_event()
{
    var x = this.getAttribute("data-x");
    var y = this.getAttribute("data-y");

    if (preview_direction == 0) {
        if (!tiles[curtile].image)
            tiles[curtile].image = tiles[curtile].get_image();

        preview.data[y][x] = curtile;
        preview.img[y][x].src = tiles[curtile].get_image();
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
                ptiles[y][x] = (op.data[y][x] % tiles.length);
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

            p.img[y][x].setAttribute("title", tile.name);
            p.img[y][x].src = tile.get_image();
        }
    }
}

function generate_preview(style)
{
    var x, y;
    var p = preview;

    if (!preview)
        return;

    if (preview_disable[style])
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
        if (prev_walls > -1) {
            t = prev_walls;
            prev_walls = -1;
        }
        if (!tiles[t].name.match(/walls?\b/)) {
            for (var i = 0; i < tiles.length; i++)
                if (tiles[(i+t)%tiles.length].name.match(/walls?\b/))
                    break;
            if (i == tiles.length) {
                alert("Wall tiles not found.");
                preview_disable[style] = 1;
                break;
            }
            t = ((i+t) % tiles.length);
        }
        prev_walls = (t + 11) % tiles.length;
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
    case "swallow":
    case "explosion":
        var re;
        var t = curtile;
        var j = 0;
        if (style == "swallow")
            re = /swallow/;
        else {
            re = /explosion/;
            if (prev_explosion > -1) {
                t = prev_explosion;
                prev_explosion = -1;
            }
        }
        if (!tiles[t].name.match(re)) {
            for (var i = 0; i < tiles.length; i++)
                if (tiles[(i+t)%tiles.length].name.match(re))
                    break;
            if (i == tiles.length) {
                alert("Tiles for "+style+" not found.");
                preview_disable[style] = 1;
                break;
            }
            t = ((i+t) % tiles.length);
        }
        if (style == "explosion")
            prev_explosion = (t + 9) % tiles.length;
        if (preview.w < 3)
            setup_preview(3, preview.h);
        for (y = 0; y < 3; y++) {
            for (x = 0; x < 3; x++) {
                if (!(x == 1 && y == 1 && style == "swallow")) {
                    preview.data[y][x] = (t + (j++)) % tiles.length;
                }
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
            tiles[curtile].selection_draw(1);
            tiles[curtile].selection_toggle(tx, ty);
            tiles[curtile].selection_draw();
        }
    } else if (drawmode == "draw") {
        if (clipboard) {
            paste_clipboard(clipboard, cursor_x, cursor_y)
            draw_clipboard(tx, ty, clipboard, 0);
        } else {
            tiles[curtile].setpixel(tx, ty, curcolor);
            tiles[curtile].draw_pixel(tx, ty);
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
        tiles[curtile].draw_pixel(cursor_x, cursor_y);
        if (drawmode == "draw")
            draw_clipboard(cursor_x, cursor_y, clipboard, 1);
    }
    cursor_x = cursor_y = -1;
}

function draw_cursor(tx, ty)
{
    if (cursor_x >= 0) {
        tiles[curtile].draw_pixel(cursor_x, cursor_y);
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
                tile.draw_pixel(x, y);
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
            var fromclr = tile.getpixel(tx, ty);
            if (fromclr != data[i].pixel) {
                tile.setpixel(tx, ty, data[i].pixel);
                multiple.push(tile._undo.pop());
                changed = 1;
            }
        }
    }

    canvas_update = 1;
    if (changed) {
        tile._undo.push({ multi: multiple });
        tile.update();
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
        tiles[curtile].selection_draw(1);
        if (cursor_x >= 0) {
            for (sx = Math.min(sel_rect.x1, cursor_x); sx <= Math.max(sel_rect.x1, cursor_x); sx++) {
                for (sy = Math.min(sel_rect.y1, cursor_y); sy <= Math.max(sel_rect.y1, cursor_y); sy++) {
                    tiles[curtile].selection_remove(sx, sy);
                }
            }
        }

        for (sx = Math.min(sel_rect.x1, tx); sx <= Math.max(sel_rect.x1, tx); sx++) {
            for (sy = Math.min(sel_rect.y1, ty); sy <= Math.max(sel_rect.y1, ty); sy++) {
                tiles[curtile].selection_add(sx, sy);
            }
        }
    }

    draw_cursor(tx, ty);

    if (drawmode == "selection") {
        tiles[curtile].selection_draw();
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
    tiles[curtile].update();
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

function draw_pixel(tx,ty, clrkey)
{
    ctx.fillStyle = palette[clrkey].color;
    ctx.fillRect(tx*scale, ty*scale, scale, scale);
}

function get_tile_code(tilenum, showedited)
{
    var ty;
    var tile = tiles[tilenum];
    var edited = "";
    if (showedited && tile._undo && tile._undo.length > 0)
        edited = "edited ";

    var s = "# tile " + tilenum + " (" + edited + tile.name + ")\n";
    s += "{\n";
    for (ty = 0; ty < tile.hei; ty++) {
        s += "  " + tile.data[ty] + "\n";
    }
    s += "}\n";

    return s;
}

function show_tile_code(tile)
{
    var e = document.getElementById("show-tile-format");
    e.textContent = tile.get_code(1);
}

function show_tile_download()
{
    var e = document.getElementById("download-file");
    var b = document.createElement("input");
    b.type = "button";
    b.value = "Download tileset";
    e.innerHTML = "";
    b.addEventListener("click", download_tileset);
    e.appendChild(b);
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function sortfunc(a,b)
{
    if (a.charAt(0).match(/[0-9]/) && !b.charAt(0).match(/[0-9]/)) return 1;
    if (!a.charAt(0).match(/[0-9]/) && b.charAt(0).match(/[0-9]/)) return -1;
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}

function download_tileset()
{
    var s = "";
    var i;
    var fname;
    var fie = document.getElementById('fileInput');

    if (fie && fie.files && fie.files[0])
        fname = document.getElementById('fileInput').files[0].name;

    if (!fname)
        fname = "example_nethack_tiles.txt";

    var colorkeys = Object.keys(palette);

    for (const key in colorkeys.sort(sortfunc)) {
        var c = palette[colorkeys[key]].color;
        c = c.replace(/^rgb/, "");
        s = s + colorkeys[key] + " = " + c + "\n";
    }

    for (i = 0; i < tiles.length; i++) {
        s = s + tiles[i].get_code(0);
    }

    download(fname, s);
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
    tiles[curtile].update();
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
            change_drawing_color(tiles[curtile].getpixel(cursor_x, cursor_y));
        }
        break;
    case "u": /* undo */
        if (drawmode == "draw")
            tiles[curtile].undo();
        break;
    case "r": /* replace all pixels of (color under curse) with current color */
        if (drawmode == "draw" && cursor_x >= 0) {
            tiles[curtile].replace_color(tiles[curtile].getpixel(cursor_x, cursor_y), curcolor);
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
    case "4": /* explosion tiles preview */
        generate_preview("explosion");
        break;
    case "5": /* swallow tiles preview */
        generate_preview("swallow");
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
            tiles[curtile].update();
        } else {
            set_drawmode("selection");
            tiles[curtile].update();
        }
        break;
    case "c": /* add selection as new clipping, change to draw mode */
        if (drawmode == "selection") {
            if (clipboard && cursor_x >= 0) {
                draw_clipboard(cursor_x, cursor_y, clipboard, 1);
            }
            clipboard = tiles[curtile].selection_getdata();
            if (clipboard) {
                clippings.push(clipboard);
                clippings_idx = clippings.length-1;
                set_drawmode("draw");
                tiles[curtile].update();
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
            tiles[curtile].selection_draw(1);
            tiles[curtile].selection = null;
            tiles[curtile].selection = new Array();
        }
        break;
    case "i": /* invert selection */
        if (drawmode == "selection") {
            tiles[curtile].selection_draw(1);
            var tx, ty;
            for (tx = 0; tx < tiles[curtile].wid; tx++)
                for (ty = 0; ty < tiles[curtile].hei; ty++)
                    tiles[curtile].selection_toggle(tx, ty);
            tiles[curtile].selection_draw();
        }
        break;
    case "t": /* toggle selection of all pixels of (color under cursor) */
        if (drawmode == "selection" && cursor_x >= 0) {
            tiles[curtile].selection_draw(1);
            var tx, ty;
            var clrkey = tiles[curtile].getpixel(cursor_x, cursor_y);
            for (tx = 0; tx < tiles[curtile].wid; tx++)
                for (ty = 0; ty < tiles[curtile].hei; ty++)
                    if (tiles[curtile].getpixel(tx, ty) == clrkey)
                        tiles[curtile].selection_toggle(tx, ty);
            tiles[curtile].selection_draw();
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
