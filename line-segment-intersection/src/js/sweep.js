var SWEEP = {
  SVGNS: "http://www.w3.org/2000/svg",
  XLink: "http://www.w3.org/1999/xlink",
  animationSpeed: 1,
  sweepActive: !1,
  compare: function (a, b) {
    return a.compare(b);
  },
  init: function () {
    function a() {
      requestAnimationFrame(a);
      TWEEN.update();
    }
    this.points = new js_cols.RedBlackSet(this.compare);
    this.events = new js_cols.RedBlackSet(this.compare);
    this.status = new js_cols.RedBlackSet(this.compare);
    SWEEP.SVG.init();
    SWEEP.Gui.init();
    SWEEP.Info.init();
    SWEEP.Sweepline.init();
    SWEEP.SVG.resize();
    SWEEP.Input();
    a();
  },
  sweep: function () {
    this.sweepActive = !0;
    this.cleanup();
    SWEEP.Sweepline.sweepNext(
      !this.events.isEmpty() ? this.events.getMin() : null
    );
  },
  cleanup: function () {
    this.events.traverse(function (a) {
      a.intersecting.clear();
      a.setStyle();
      a.starting.isEmpty() && a.ending.isEmpty() && a.remove();
    }, this);
    this.events.clear();
    this.events.insertAll(SWEEP.points);
    this.status.clear();
  },
  onEnd: function () {
    SWEEP.Sweepline.position = -1;
    SWEEP.Sweepline.setPosition();
    console.log("\nIntersections:");
    this.events.traverse(function (a) {
      a.intersecting.isEmpty() || console.log("\t" + a.toString());
    }, this);
    this.sweepActive = !1;
    this.status.isEmpty() || console.warn("status not empty");
  },
};
SWEEP.SVG = {
  init: function () {
    var a = this;
    this.context = document.createElementNS(SWEEP.SVGNS, "svg");
    this.context.setAttribute("xmlns:xlink", SWEEP.XLink);
    document.body.appendChild(this.context);
    this.context.appendChild(
      this.loadXML("images/sweep.svg").documentElement.firstElementChild
        .nextElementSibling
    );
    this.addGroup("sweepline");
    this.addGroup("line");
    this.addGroup("point");
    this.addGroup("gui");
    window.addEventListener(
      "resize",
      function () {
        a.resize();
      },
      !1
    );
  },
  resize: function () {
    this.width = window.innerWidth;
    this.height = window.innerHeight*0.9;
    this.drawingAreaHeight = Math.min(
      Math.round(0.9 * this.height),
      this.height - 20
    );
    this.context.setAttribute(
      "viewBox",
      "0, 0," + this.width + "," + this.height
    );
    this.context.setAttribute("width", this.width + "px");
    this.context.setAttribute("height", this.height + "px");
    SWEEP.Sweepline.setWidth(this.width);
    SWEEP.Gui.setDimensions(
      this.drawingAreaHeight,
      this.width,
      this.height - this.drawingAreaHeight
    );
    SWEEP.Info.setDimensions(this.width, this.drawingAreaHeight);
  },
  addGroup: function (a) {
    this[a] = document.createElementNS(SWEEP.SVGNS, "g");
    this.context.appendChild(this[a]);
  },
  append: function (a, b) {
    this[b].appendChild(a);
  },
  remove: function (a, b) {
    this[b].removeChild(a);
  },
  removeAll: function (a) {
    for (; this[a].hasChildNodes(); ) this[a].removeChild(this[a].firstChild);
  },
  loadXML: function (a) {
    var b = new XMLHttpRequest();
    b.open("GET", a, !1);
    b.setRequestHeader("Content-Type", "text/xml");
    b.send("");
    return b.responseXML;
  },
};
SWEEP.Gui = {
  init: function () {
    this.background = document.createElementNS(SWEEP.SVGNS, "rect");
    this.background.setAttribute("x", 0);
    this.background.setAttribute("class", "guibackground");
    SWEEP.SVG.append(this.background, "gui");
    this.buttons = [];
    this.buttons.push(
      new SWEEP.Button("Clear", function () {
        SWEEP.Info.setVisibility(!1);
        SWEEP.SVG.removeAll("line");
        SWEEP.SVG.removeAll("point");
        SWEEP.points.clear();
        SWEEP.events.clear();
      })
    );
    this.buttons.push(
      new SWEEP.Button("Sweep", function () {
        SWEEP.Info.setVisibility(!1);
        SWEEP.sweep();
      })
    );
    this.buttons.push(
      new SWEEP.Button("About", function () {
        SWEEP.Info.toggleVisibility();
      })
    );
  },
  setDimensions: function (a, b, c) {
    this.background.setAttribute("y", a);
    this.background.setAttribute("width", b);
    this.background.setAttribute("height", c);
    for (var d = (b = Math.round(0.1 * c)), e = 0; e < this.buttons.length; e++)
      d += b + this.buttons[e].setGeometry(d, a, c, 3 * b);
  },
};
SWEEP.Button = function (a, b) {
  this.rect = document.createElementNS(SWEEP.SVGNS, "rect");
  this.rect.setAttribute("class", "button");
  SWEEP.SVG.append(this.rect, "gui");
  this.text = document.createElementNS(SWEEP.SVGNS, "text");
  this.text.setAttribute("class", "buttonText");
  SWEEP.SVG.append(this.text, "gui");
  var c = document.createTextNode(a);
  this.text.appendChild(c);
  this.rect.addEventListener(
    "click",
    function () {
      SWEEP.sweepActive || b();
    },
    !1
  );
};
SWEEP.Button.prototype = {
  constructor: SWEEP.Button,
  setGeometry: function (a, b, c, d) {
    this.text.style.fontSize = 0.5 * c + "px";
    var e = this.text.offsetWidth || this.text.getBBox().width;
    this.text.setAttribute("x", a + d);
    this.text.setAttribute("y", b + 0.68 * c);
    this.rect.setAttribute("x", a);
    this.rect.setAttribute("y", b);
    this.rect.setAttribute("width", e + 2 * d);
    this.rect.setAttribute("height", c);
    return e + 2 * d;
  },
};
SWEEP.Info = {
  visible: !0,
  init: function () {
    this.group = document.createElementNS(SWEEP.SVGNS, "g");
    SWEEP.SVG.append(this.group, "gui");
    this.background = document.createElementNS(SWEEP.SVGNS, "rect");
    this.background.setAttribute("x", 10);
    this.background.setAttribute("y", 10);
    this.background.setAttribute("rx", 10);
    this.background.setAttribute("ry", 10);
    this.background.setAttribute("class", "guiabout");
    this.group.appendChild(this.background);
    this.info = document.createElementNS(SWEEP.SVGNS, "use");
    this.info.setAttributeNS(SWEEP.XLink, "href", "#info");
    this.group.appendChild(this.info);
  },
  setDimensions: function (a, b) {
    this.background.setAttribute("width", Math.max(0, a - 20));
    this.background.setAttribute("height", Math.max(0, b - 20));
    var c = Math.min(a, b) - 40,
      d = Math.max(0.01, c / 100);
    this.info.setAttribute(
      "transform",
      "scale(" +
        d +
        ") translate(" +
        (a - c) / (2 * d) +
        "," +
        (b - c) / (2 * d) +
        ")"
    );
  },
  setVisibility: function (a) {
    this.visible = a;
    this.group.style.visibility = a ? "visible" : "hidden";
  },
  toggleVisibility: function () {
    this.setVisibility(!this.visible);
  },
};
SWEEP.Input = function () {
  function a(a) {
    function b(a) {
      a.preventDefault();
      a.stopPropagation();
      g = a.clientX || (a.touches && a.touches[0].clientX);
      h = a.clientY || (a.touches && a.touches[0].clientY);
      void 0 !== g &&
        void 0 !== h &&
        (c.point2.setAttribute("cx", g),
        c.point2.setAttribute("cy", h),
        c.line.setAttribute("x2", g),
        c.line.setAttribute("y2", h));
    }
    function d() {
      0 < g &&
        g < SWEEP.SVG.width &&
        0 < h &&
        h < SWEEP.SVG.drawingAreaHeight &&
        new SWEEP.Line(j, l, g, h);
      f();
    }
    function f() {
      c.point1.style.visibility = "hidden";
      c.point2.style.visibility = "hidden";
      c.line.style.visibility = "hidden";
      document.removeEventListener("mousemove", b, !1);
      document.removeEventListener("touchmove", b, !1);
      document.removeEventListener("mouseup", d, !1);
      document.removeEventListener("touchend", d, !1);
      document.removeEventListener("touchcancel", f, !1);
      document.removeEventListener("touchleave", f, !1);
    }
    if (
      !SWEEP.sweepActive &&
      !((a.clientY || a.touches[0].clientY) > SWEEP.SVG.drawingAreaHeight)
    ) {
      a.toElement &&
        "githublink" !== a.toElement.id &&
        (a.preventDefault(), a.stopPropagation());
      SWEEP.Info.setVisibility(!1);
      var j = a.clientX || (a.touches && a.touches[0].clientX),
        l = a.clientY || (a.touches && a.touches[0].clientY),
        g = j,
        h = l;
      c.point1.setAttribute("cx", j);
      c.point1.setAttribute("cy", l);
      c.point1.style.visibility = "visible";
      c.point2.setAttribute("cx", g);
      c.point2.setAttribute("cy", h);
      c.point2.style.visibility = "visible";
      c.line.setAttribute("x1", j);
      c.line.setAttribute("y1", l);
      c.line.setAttribute("x2", g);
      c.line.setAttribute("y2", h);
      c.line.style.visibility = "visible";
      document.addEventListener("mousemove", b, !1);
      document.addEventListener("touchmove", b, !1);
      document.addEventListener("mouseup", d, !1);
      document.addEventListener("touchend", d, !1);
      document.addEventListener("touchcancel", f, !1);
      document.addEventListener("touchleave", f, !1);
    }
  }
  function b(a) {
    a.stopPropagation();
  }
  var c = this;
  this.point1 = document.createElementNS(SWEEP.SVGNS, "circle");
  this.point1.setAttribute("r", 6);
  this.point1.setAttribute("fill", "red");
  this.point1.style.visibility = "hidden";
  SWEEP.SVG.append(this.point1, "gui");
  this.point2 = document.createElementNS(SWEEP.SVGNS, "circle");
  this.point2.setAttribute("r", 6);
  this.point2.setAttribute("fill", "red");
  this.point2.style.visibility = "hidden";
  SWEEP.SVG.append(this.point2, "gui");
  this.line = document.createElementNS(SWEEP.SVGNS, "line");
  this.line.setAttribute("fill", "none");
  this.line.setAttribute("stroke", "red");
  this.line.setAttribute("stroke-width", "4px");
  this.line.style.visibility = "hidden";
  SWEEP.SVG.append(this.line, "gui");
  document.addEventListener("mousedown", a, !1);
  document.addEventListener("touchstart", a, !1);
  var d = document.getElementById("githublink");
  d.addEventListener("mousedown", b, !1);
  d.addEventListener("touchstart", b, !1);
};
SWEEP.Sweepline = {
  position: -1,
  pairs: [],
  init: function () {
    this.rect = document.createElementNS(SWEEP.SVGNS, "rect");
    this.rect.setAttribute("x", 0);
    this.rect.setAttribute("height", 40);
    this.rect.setAttribute("class", "sweeprect");
    SWEEP.SVG.append(this.rect, "sweepline");
    this.line = document.createElementNS(SWEEP.SVGNS, "line");
    this.line.setAttribute("x1", 0);
    this.line.setAttribute("class", "sweepline");
    SWEEP.SVG.append(this.line, "sweepline");
    this.setPosition();
  },
  setWidth: function (a) {
    this.rect.setAttribute("width", a);
    this.line.setAttribute("x2", a);
  },
  setPosition: function () {
    this.rect.setAttribute("y", this.position - 40);
    this.line.setAttribute("y1", this.position);
    this.line.setAttribute("y2", this.position);
  },
  eventCall: function () {
    var a = this.current,
      b = [];
    if (!a.intersecting.isEmpty() || 1 < a.starting.size + a.ending.size) {
      SWEEP.status = SWEEP.status.clone();
      a.starting = a.starting.clone();
      a.ending = a.ending.clone();
      a.intersecting = a.intersecting.clone();
      if (
        !a.ending.isEmpty() &&
        a.intersecting.isSubsetOf(a.ending) &&
        a.starting.isEmpty()
      ) {
        b.push("Removing");
        var c = SWEEP.status.predecessor(a.ending.getMin()),
          d = SWEEP.status.successor(a.ending.getMax());
        SWEEP.status.removeAll(a.ending);
      } else {
        d = a.intersecting.clone();
        a.ending.isEmpty() ||
          (b.push("Removing"),
          d.removeAll(a.ending),
          SWEEP.status.removeAll(a.ending),
          a.intersecting.insertAll(a.ending),
          a.setStyle());
        d.isEmpty() || b.push("Switching");
        a.starting.isEmpty() ||
          (b.push("Adding"),
          d.insertAll(a.starting),
          SWEEP.status.insertAll(a.starting),
          a.intersecting.insertAll(a.starting),
          a.setStyle());
        var e = d.getMin(),
          c = SWEEP.status.predecessor(e);
        this.pairs.push([c, e]);
        c = d.getMax();
        d = SWEEP.status.successor(c);
      }
      this.pairs.push([c, d]);
    } else
      a.ending.isEmpty()
        ? a.starting.isEmpty() ||
          (b.push("Adding"),
          (e = a.starting.getMin()),
          SWEEP.status.insert(e),
          (c = SWEEP.status.predecessor(e)),
          (d = SWEEP.status.successor(e)),
          this.pairs.push([c, e]),
          this.pairs.push([e, d]))
        : (b.push("Removing"),
          (e = a.ending.getMin()),
          (c = SWEEP.status.predecessor(e)),
          (d = SWEEP.status.successor(e)),
          SWEEP.status.remove(e),
          this.pairs.push([c, d]));
    console.log(
      "Event: " + a.toString() + "; Actions: " + b.join(", ") + "; Status:"
    );
    SWEEP.status.traverse(function (a) {
      console.log("\t" + a.toString());
    }, this);
    this.doPairs();
  },
  doPairs: function () {
    0 < this.pairs.length
      ? this.intersectionCheck(this.pairs.pop())
      : this.sweepNext(SWEEP.events.successor(this.current));
  },
  intersectionCheck: function (a) {
    var b = a[0],
      c = a[1];
    null !== b && null !== c
      ? ((this.action = 0),
        (b.line.style.stroke = "red"),
        (c.line.style.stroke = "red"),
        (a = b.intersect(c)),
        null !== a &&
          ((a = new SWEEP.Point(a[0], a[1])),
          SWEEP.events.contains(a)
            ? (a = SWEEP.events.get_(a).key)
            : (a.draw(), SWEEP.events.insert(a)),
          a.intersecting.insert(b),
          a.intersecting.insert(c),
          a.setStyle()),
        new TWEEN.Tween(this)
          .to({ action: 100 }, 400 * SWEEP.animationSpeed)
          .onUpdate(function () {
            var a = ((50 - Math.abs(this.action - 50)) * 0.02 + 0.5) * 4;
            b.line.style.strokeWidth = a + "px";
            c.line.style.strokeWidth = a + "px";
          })
          .onComplete(function () {
            b.line.style.stroke = "#ccc";
            c.line.style.stroke = "#ccc";
            this.doPairs();
          })
          .start())
      : this.doPairs();
  },
  sweepNext: function (a) {
    if (null !== a)
      (this.current = a),
        this.sweepTo(a.y, function () {
          a.animate();
        });
    else if (this.position < SWEEP.SVG.drawingAreaHeight + 41)
      this.sweepTo(SWEEP.SVG.drawingAreaHeight + 41, function () {
        SWEEP.onEnd();
      });
    else SWEEP.onEnd();
  },
  sweepTo: function (a, b) {
    new TWEEN.Tween(this)
      .to({ position: a }, 5 * (a - this.position) * SWEEP.animationSpeed)
      .onUpdate(function () {
        this.setPosition();
      })
      .onComplete(b)
      .start();
  },
};
SWEEP.Point = function (a, b) {
  this.x = a;
  this.y = b;
  this.starting = new js_cols.RedBlackSet(SWEEP.compare);
  this.ending = new js_cols.RedBlackSet(SWEEP.compare);
  this.intersecting = new js_cols.RedBlackSet(SWEEP.compare);
};
SWEEP.Point.prototype = {
  constructor: SWEEP.Point,
  draw: function () {
    this.point = document.createElementNS(SWEEP.SVGNS, "circle");
    this.point.setAttribute("cx", this.x);
    this.point.setAttribute("cy", this.y);
    this.point.setAttribute("r", 4);
    this.point.setAttribute("class", "point");
    SWEEP.SVG.append(this.point, "point");
    this.intersection = document.createElementNS(SWEEP.SVGNS, "circle");
    this.intersection.setAttribute("cx", this.x);
    this.intersection.setAttribute("cy", this.y);
    this.intersection.setAttribute("r", 6);
    this.intersection.setAttribute("class", "intersection");
    SWEEP.SVG.append(this.intersection, "point");
  },
  remove: function () {
    SWEEP.SVG.remove(this.point, "point");
  },
  animate: function () {
    this.action = -100;
    this.point.style.fill = "red";
    this.intersection.style.stroke = "red";
    new TWEEN.Tween(this)
      .to({ action: 100 }, 400 * SWEEP.animationSpeed)
      .onUpdate(function () {
        this.setSize(4 * (0.02 * (100 - Math.abs(this.action)) + 1));
      })
      .onComplete(function () {
        this.point.style.fill = "#999";
        this.intersection.style.stroke = "#157";
        SWEEP.Sweepline.eventCall();
      })
      .start();
  },
  setSize: function (a) {
    this.point.setAttribute("r", a);
    this.intersection.setAttribute("r", a + 2);
  },
  setStyle: function () {
    this.point.style.visibility =
      this.starting.isEmpty() && this.ending.isEmpty() ? "hidden" : "visible";
    this.intersection.style.visibility = this.intersecting.isEmpty()
      ? "hidden"
      : "visible";
  },
  toString: function () {
    return (
      "{x:" +
      Math.round(100 * this.x) / 100 +
      ",y:" +
      Math.round(100 * this.y) / 100 +
      "}"
    );
  },
  compare: function (a) {
    return this.y < a.y
      ? -1
      : a.y < this.y
      ? 1
      : this.x < a.x
      ? -1
      : a.x < this.x
      ? 1
      : 0;
  },
};
SWEEP.Line = function (a, b, c, d) {
  this.x1 = a;
  this.y1 = b;
  this.x2 = c;
  this.y2 = b !== d ? d : d + 1;
  this.line = document.createElementNS(SWEEP.SVGNS, "line");
  this.line.setAttribute("x1", this.x1);
  this.line.setAttribute("y1", this.y1);
  this.line.setAttribute("x2", this.x2);
  this.line.setAttribute("y2", this.y2);
  this.line.setAttribute("class", "line");
  SWEEP.SVG.append(this.line, "line");
  a = this.addPoint(this.x1, this.y1);
  b = this.addPoint(this.x2, this.y2);
  0 < b.compare(a)
    ? (a.starting.insert(this), b.ending.insert(this))
    : (b.starting.insert(this), a.ending.insert(this));
  a.setStyle();
  b.setStyle();
};
SWEEP.Line.prototype = {
  constructor: SWEEP.Line,
  compare: function (a) {
    return this.getSweepIntersection() < a.getSweepIntersection()
      ? -1
      : a.getSweepIntersection() < this.getSweepIntersection()
      ? 1
      : 0;
  },
  addPoint: function (a, b) {
    var c = new SWEEP.Point(a, b);
    SWEEP.points.contains(c)
      ? (c = SWEEP.points.get_(c).key)
      : (c.draw(), SWEEP.points.insert(c));
    return c;
  },
  getSweepIntersection: function () {
    var a = SWEEP.Sweepline.position + 1e-4;
    return 0 === this.y2 - this.y1
      ? null
      : (this.x1 * this.y2 - this.y1 * this.x2 + a * (this.x2 - this.x1)) /
          (this.y2 - this.y1);
  },
  intersect: function (a) {
    var b = this.x1,
      c = this.y1,
      d = this.x2,
      e = this.y2,
      i = a.x1,
      k = a.y1,
      f = a.x2,
      j = a.y2,
      a = (d - b) * (j - k) - (e - c) * (f - i);
    return 0 !== a &&
      ((f = ((b - i) * (j - k) - (c - k) * (f - i)) / -a),
      (i = ((i - b) * (e - c) - (k - c) * (d - b)) / a),
      0 <= f && 1 >= f && 0 <= i && 1 >= i)
      ? [b + f * (d - b), c + f * (e - c)]
      : null;
  },
  toString: function () {
    return (
      "{line:[" + this.x1 + "," + this.y1 + "," + this.x2 + "," + this.y2 + "]}"
    );
  },
};
