var hearts = JSON.parse(localStorage.getItem("hearts")) || {};
var deviceId = localStorage.getItem("deviceId") || "";
var cardclass = "col-xs-12 col-sm-12 col-md-4 col-lg-2";

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

/**
 * Block Mithril Object
 * 
 * The DOM object for given timeframes. Each Block will chain-load Rooms
 */
var Block = {
  view: function (vnode) {
    var title = m("h2", vnode.attrs.start + " tot " + vnode.attrs.end)
    var section = m("div", { class: "blok row" },
      ProgramData.Rooms.map(function (roomdata) {
        // See if we can retrieve an active presentation for a room, given the block.
        var pres = ProgramData.getPresentation(roomdata.key, vnode.attrs);
        if (pres) {
          roomdata.presentation = pres;
        } else {
          delete roomdata.presentation;
        }
        return m(Room, roomdata);
      }));
    return m("section", { class: "timeslot"}, [title, section]);
  }
}

/**
 * Presentation Mithril Object
 */
var Presentation = {
  view: function (vnode) {
    return m("div", { style: "display:inline;",
      onclick: function(e){
        vnode.dom.classList.toggle("modal");
        vnode.dom.firstChild.classList.toggle("modal-content");
        e.stopPropagation();
      }},
      m("div", { class: "presentatie box " + vnode.attrs.thema}, [
        m("div", { class: "indicator",onclick: function(e){
          console.log("Heart clicked!");
          e.stopPropagation();
        }}, [
          m("div", { class: "heart_5617cae9ce5d0", "data-presentationid": vnode.attrs.key }),
          m("div", { class: "bar", "data-capaciteit": 0 }, m("div", { class: "fill" }, ""))
        ]),
        m("h1", vnode.attrs.ruimte + ": " + vnode.attrs.titel),
        m("h2", vnode.attrs.naam),
        m("p", vnode.attrs.beschrijving),
        m("p", m("h2", vnode.attrs.ruimte + " - " + vnode.attrs.block.start + " tot " + vnode.attrs.block.end))
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
      return m("div", { class: "ruimte " + cardclass }, m(Presentation, vnode.attrs.presentation));
    } else {
      // No presentation in this slot
      return m("div", { class: "ruimte " + cardclass }, m("section", { class: "placeholder box" }, vnode.attrs.key));
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
  hearts: [],
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
  hearts: function () {
    return m.request({
      method: "GET",
      url: "hearts.php",
      //withCredentials: true,
    })
      .then(function (result) {
        // Calculate capacities.
        //function updateHeartCounts() {
        //  $.get("/hearts.php", fillCapacities);
        //}
        console.log(result);
      })
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
    return m("div", { class: "page" }, [
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
if (!deviceId) {
  deviceId = (Math.floor(Math.random() * 1000000000)).toString(10);
  localStorage.setItem("deviceId", deviceId);
}
var root = document.body;
var header = m.mount(root, Page);

// Loop hearts and toggle on.
Array.from(document.getElementsByClassName(".heart_5617cae9ce5d0"))
  .forEach(function (el, index, array) {
    el.toggleClass("hearted", (
      function (el) {
        return !!hearts[el.data("presentatieid")];
      })
    )
});

