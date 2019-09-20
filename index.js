/**
 * In JSON, you are not allowed to assume a sequence for objects.
 * Since the key is unusable for sorting, we will sort on the start of a block.
 * Make sure the times in the Blocks are in the format HH:mm
 * 
 * @param {*} a
 * @param {*} b
 */
function BlockSort(a, b) {
  var atime = new Date('2000-01-01T' + a.start + ':00');
  var btime = new Date('2000-01-01T' + b.start + ':00');
  return atime > btime;
}

var cardclass = "col-xs-12 col-sm-12 col-md-4 col-lg-2";
/**
 * Block Mithril Object
 * 
 * The DOM object for given timeframes. Each Block will chain-load Rooms
 */
var Block = {
  view: function (vnode) {
    var title = m("h2", vnode.attrs.start + " tot " + vnode.attrs.end)
    var section = m("section", { class: "blok row", "data-blokid": "block_" + vnode.attrs.key },
      ProgramData.Rooms.map(function (roomdata) {
        // See if we can retrieve an active presentation for a room, given the block.
        var pres = ProgramData.getPresentation(roomdata.key, vnode.attrs);
        if (pres) {
          roomdata.presentation = pres;
        }
        return m(Room, roomdata);
      }));
    return m("article", [title, section]);
  }
}

/**
 * Presentation Mithril Object
 */
var Presentation = {
  view: function (vnode) {
    return m("section", { style: "display:inline;", "data-presentatieId": vnode.attrs.key,
      onclick: function(){
        console.log(vnode.dom);
        vnode.dom.classList.toggle("modal");
        vnode.dom.firstChild.classList.toggle("modal-content");
      }},
      m("div", { class: "presentatie box " + vnode.attrs.thema}, [
        m("div", { class: "indicator", "data-presentatieId": vnode.attrs.key }, [
          m("div", { class: "heart_5617cae9ce5d0", "data-presentatieId": vnode.attrs.key }),
          m("div", { class: "bar", "data-presentatieId": vnode.attrs.key, "data-capaciteit": 0 }, m("div", { class: "fill" }, ""))
        ]),
        m("h1", vnode.attrs.ruimte + ": " + vnode.attrs.titel),
        m("h2", vnode.attrs.naam),
        m("p", vnode.attrs.beschrijving),
        m("p", m("h2", vnode.attrs.block.start + " tot " + vnode.attrs.block.end))
      ])
    );
  }
}

/**
 * Room Mithril Object
 */
var Room = {
  view: function (vnode) {
    if (vnode.attrs.presentation) {
      return m("section", { class: "ruimte " + cardclass, "data-ruimteid": vnode.attrs.key }, m(Presentation, vnode.attrs.presentation));
    } else {
      // No presentation in this slot
      return m("section", { class: "ruimte " + cardclass, "data-ruimteid": vnode.attrs.key }, m("section", { class: "placeholder box" }, vnode.attrs.key));
    }

  }
}

/**
 * Helper class to retrieve All data from the server and process it
 */
var ProgramData = {
  Blocks: [],
  Rooms: [],
  Themes: {},
  Presentations: {},
  getPresentation: function (room, block) {
    // Find the presentation for the given room and block. There can be only one!
    var result;
    Object.keys(ProgramData.Presentations).some(
      function (key) {
        if (ProgramData.Presentations[key].ruimte === room && ProgramData.Presentations[key].blok === block.key) {
          var tmp = ProgramData.Presentations[key];
          tmp.key = key;
          tmp.block = block;
          result = tmp;
          return;
        }
      }
    )
    return result;
  },
  load: function () {
    return m.request({
      method: "GET",
      url: "programma.json",
      //withCredentials: true,
    })
      .then(function (result) {
        ProgramData.Presentations = result.presentaties;
        ProgramData.Themes = result.themas;
        var BlockArray = [];
        var RoomArray = [];
        Object.keys(result.blokken).forEach(
          function (key) {
            BlockArray.push({
              start: result.blokken[key].begintijd,
              end: result.blokken[key].eindtijd,
              key: key,
            });
          }
        )
        Object.keys(result.ruimtes).forEach(
          function (key) {
            RoomArray.push({
              capacity: result.ruimtes[key].capaciteit,
              key: key,
            });
          }
        )
        ProgramData.Rooms = RoomArray; // no sort yet
        ProgramData.Blocks = BlockArray.sort(BlockSort);
      })
  }
}

/**
 * Main Section, contains the entire program in detail
 */
var Program = {
  oninit: ProgramData.load,
  view: function () {
    return m("section", { class: "programma" },
      ProgramData.Blocks.map(function (blockdata) {
        return m(Block, blockdata);
      })
    )
  }
}

/**
 * Empty section at start, need to ask Johan what this does
 */
var Details = {
  view: function () {
    return m("section", { class: "details" }, "");
  }
}

/**
 * Page Heading containing general information about the program
 */
var Header = {
  view: function () {
    return m("section", { class: "header" }, [
      m("h2", "Permanent Beta"),
      m("h1", "Programma 13 november 2015"),
      m("p", "Het Lyceum Rotterdam"),
      m("p",
        m("a", {
          class: "button",
          href: "http://www.permanentbeta.nl/events/pb-dag/"
        }, "meer informatie"
        )
      ),
      m("p", { style: "margin-top: 15px" }, [
        "Klik op ",
        m("span", { style: "color: #711; font-size: 2em" }, m.trust("&#9829;")),
        " om je voorkeur aan te geven."
      ]),
      m.trust("<hr>")
    ])
  }
}

/**
 * Wrapper, the main page section
 */
var Page = {
  view: function () {
    return m("section", { class: "page" }, [
      m(Details),
      m(Header),
      m(Program)
    ]);
  }
}

/**
 *   __main__
 *   Starts the rendering
 */
var root = document.body;
var header = m.mount(root, Page);

