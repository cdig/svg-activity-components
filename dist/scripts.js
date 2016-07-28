(function() {
  var base,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  Take(["Registry", "ScopeBuilder", "SVGCrawler", "DOMContentLoaded"], function(Registry, ScopeBuilder, SVGCrawler) {
    var crawlerData;
    crawlerData = SVGCrawler(document.getElementById("root"));
    Make("SVGReady");
    return setTimeout(function() {
      Registry.closeRegistration();
      ScopeBuilder(crawlerData);
      Make("ScopeSetup");
      Make("ScopeReady");
      return Make("AllReady");
    });
  });

  Take(["Dev", "Registry", "Symbol"], function(Dev, Registry, Symbol) {
    var ScopeBuilder;
    return Make("ScopeBuilder", ScopeBuilder = function(target, parentScope) {
      var attr, attrs, element, instanceName, len, len1, len2, m, n, q, ref, ref1, ref2, results, scope, scopeProcessor, strippedName, subTarget, symbol, symbolForInstanceName, symbolName;
      if (parentScope == null) {
        parentScope = null;
      }
      element = target.elm;
      strippedName = (ref = element.id) != null ? ref.split("_")[0] : void 0;
      symbolForInstanceName = Symbol.forInstanceName(element.id);
      if (symbolForInstanceName != null) {
        instanceName = element.id;
        symbol = symbolForInstanceName;
      } else if ((strippedName != null ? strippedName.indexOf("Line") : void 0) > -1) {
        symbolName = "HydraulicLine";
        symbol = Symbol.forSymbolName(symbolName);
      } else if ((strippedName != null ? strippedName.indexOf("Field") : void 0) > -1) {
        symbolName = "HydraulicField";
        symbol = Symbol.forSymbolName(symbolName);
      } else if ((strippedName != null ? strippedName.indexOf("Mask") : void 0) > -1) {
        symbolName = "Mask";
        symbol = Symbol.forSymbolName(symbolName);
      } else {
        symbolName = "DefaultElement";
        symbol = Symbol.forSymbolName(symbolName);
      }
      scope = symbol.create(element);
      element._scope = scope;
      scope.element = element;
      scope.children = [];
      scope.parent = parentScope;
      scope.root = (parentScope != null ? parentScope.root : void 0) || scope;
      scope.childName = "child" + ((parentScope != null ? parentScope.children.length : void 0) || 0);
      scope.instanceName = instanceName || strippedName || scope.childName;
      scope._symbol = symbol;
      element.setAttribute("scope-name", scope.instanceName);
      if (Dev) {
        attrs = Array.prototype.slice.call(element.attributes);
        for (m = 0, len = attrs.length; m < len; m++) {
          attr = attrs[m];
          if (attr.name !== "scope-name") {
            element.removeAttributeNS(attr.namespaceURI, attr.name);
            element.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
          }
        }
      }
      ref1 = Registry.all("ScopeProcessor");
      for (n = 0, len1 = ref1.length; n < len1; n++) {
        scopeProcessor = ref1[n];
        scopeProcessor(scope);
      }
      ref2 = target.sub;
      results = [];
      for (q = 0, len2 = ref2.length; q < len2; q++) {
        subTarget = ref2[q];
        results.push(ScopeBuilder(subTarget, scope));
      }
      return results;
    });
  });

  Take(["SVG"], function(SVG) {
    var SVGCrawler, crawl, defs, deprecations;
    deprecations = ["controlPanel", "ctrlPanel", "navOverlay"];
    defs = {};
    Make("SVGCrawler", SVGCrawler = function(elm) {
      var tree;
      tree = crawl(elm);
      defs = null;
      return tree;
    });
    return crawl = function(elm) {
      var childElm, childNodes, clone, def, defId, len, m, ref, target;
      target = {
        elm: elm,
        sub: []
      };
      childNodes = Array.prototype.slice.call(elm.childNodes);
      for (m = 0, len = childNodes.length; m < len; m++) {
        childElm = childNodes[m];
        if (ref = childElm.id, indexOf.call(deprecations, ref) >= 0) {
          console.log("#" + childElm.id + " is obsolete. Please remove it from your FLA and re-export this SVG.");
          elm.removeChild(childElm);
        } else if (childElm instanceof SVGGElement) {
          target.sub.push(crawl(childElm));
        } else if (childElm instanceof SVGUseElement) {
          defId = childElm.getAttribute("xlink:href");
          def = defs[defId] != null ? defs[defId] : defs[defId] = SVG.defs.querySelector(defId);
          clone = def.cloneNode(true);
          elm.replaceChild(clone, childElm);
          if (def.parentNode != null) {
            def.parentNode.removeChild(def);
          }
          if (clone instanceof SVGGElement) {
            target.sub.push(crawl(clone));
          }
        }
      }
      return target;
    };
  });

  Take(["FlowArrows:Config", "SVG", "TRS"], function(Config, SVG, TRS) {
    return Make("FlowArrows:Arrow", function(parentElm, segmentData, segmentPosition, vectorPosition, vectorIndex) {
      var arrow, element, line, triangle, vector;
      vector = segmentData.vectors[vectorIndex];
      element = TRS(SVG.create("g", parentElm));
      triangle = SVG.create("polyline", element, {
        points: "0,-16 30,0 0,16"
      });
      line = SVG.create("line", element, {
        x1: -23,
        y1: 0,
        x2: 5,
        y2: 0,
        "stroke-width": 11,
        "stroke-linecap": "round"
      });
      return arrow = {
        update: function(parentFlow, parentScale) {
          var scale;
          if (Config.SPACING < 60 * parentScale) {
            throw "Your flow arrows are overlapping. What the devil are you trying? You need to convince Ivan that what you are doing is okay.";
          }
          if (parentScale < 0.1) {
            throw "Your arrows are so small that they might not be visible. If this is necessary, then you are doing something suspicious and need to convince Ivan that what you are doing is okay.";
          }
          vectorPosition += parentFlow;
          segmentPosition += parentFlow;
          while (vectorPosition > vector.dist) {
            vectorIndex++;
            if (vectorIndex >= segmentData.vectors.length) {
              vectorIndex = 0;
              segmentPosition -= segmentData.dist;
            }
            vectorPosition -= vector.dist;
            vector = segmentData.vectors[vectorIndex];
          }
          while (vectorPosition < 0) {
            vectorIndex--;
            if (vectorIndex < 0) {
              vectorIndex = segmentData.vectors.length - 1;
              segmentPosition += segmentData.dist;
            }
            vector = segmentData.vectors[vectorIndex];
            vectorPosition += vector.dist;
          }
          if (segmentPosition < segmentData.dist / 2) {
            scale = Math.max(0, Math.min(1, (segmentPosition / segmentData.dist) * segmentData.dist / Config.FADE_LENGTH));
          } else {
            scale = Math.max(0, Math.min(1, 1 - (segmentPosition - (segmentData.dist - Config.FADE_LENGTH)) / Config.FADE_LENGTH));
          }
          return TRS.abs(element, {
            x: Math.cos(vector.angle) * vectorPosition + vector.x,
            y: Math.sin(vector.angle) * vectorPosition + vector.y,
            scale: scale * parentScale,
            r: vector.angle / (2 * Math.PI) + (parentFlow < 0 ? 0.5 : 0)
          });
        }
      };
    });
  });

  (function() {
    var Config, defineProp;
    Make("FlowArrows:Config", Config = {
      SCALE: 1,
      SPACING: 600,
      FADE_LENGTH: 50,
      MIN_SEGMENT_LENGTH: 200,
      SPEED: 200,
      MIN_EDGE_LENGTH: 8,
      CONNECTED_DISTANCE: 1,
      wrap: function(obj) {
        var k;
        for (k in Config) {
          if (k !== "wrap") {
            defineProp(obj, k);
          }
        }
        return obj;
      }
    });
    return defineProp = function(obj, k) {
      return Object.defineProperty(obj, k, {
        get: function() {
          return Config[k];
        },
        set: function(v) {
          return Config[k] = v;
        }
      });
    };
  })();

  Take(["Pressure", "SVG"], function(Pressure, SVG) {
    return Make("FlowArrows:Containerize", function(parentElm, setupFn) {
      var active, children, direction, enabled, flow, pressure, scale, scope, updateActive, visible;
      direction = 1;
      flow = 1;
      pressure = null;
      scale = 1;
      active = true;
      enabled = true;
      visible = true;
      scope = {
        element: SVG.create("g", parentElm),
        reverse: function() {
          return direction *= -1;
        },
        update: function(parentFlow, parentScale) {
          var child, f, len, m, results, s;
          if (active) {
            f = flow * direction * parentFlow;
            s = scale * parentScale;
            results = [];
            for (m = 0, len = children.length; m < len; m++) {
              child = children[m];
              results.push(child.update(f, s));
            }
            return results;
          }
        }
      };
      children = setupFn(scope);
      updateActive = function() {
        active = enabled && visible && flow !== 0;
        return SVG.styles(scope.element, {
          display: active ? null : "none"
        });
      };
      Object.defineProperty(scope, 'enabled', {
        set: function(val) {
          if (visible !== val) {
            return updateActive(visible = val);
          }
        }
      });
      Object.defineProperty(scope, 'flow', {
        get: function() {
          return flow;
        },
        set: function(val) {
          if (flow !== val) {
            return updateActive(flow = val);
          }
        }
      });
      Object.defineProperty(scope, 'pressure', {
        get: function() {
          return pressure;
        },
        set: function(val) {
          var color;
          if (pressure !== val) {
            pressure = val;
            color = Pressure(val);
            return SVG.attrs(scope.element, {
              fill: color,
              stroke: color
            });
          }
        }
      });
      Object.defineProperty(scope, 'scale', {
        get: function() {
          return scale;
        },
        set: function(val) {
          if (scale !== val) {
            return scale = val;
          }
        }
      });
      Object.defineProperty(scope, 'visible', {
        get: function() {
          return visible;
        },
        set: function(val) {
          if (visible !== val) {
            return updateActive(visible = val);
          }
        }
      });
      return scope;
    });
  });

  Take(["FlowArrows:Config", "FlowArrows:Process", "FlowArrows:Set", "Reaction", "Tick"], function(Config, Process, Set, Reaction, Tick) {
    var animateMode, enableAll, sets, visible;
    sets = [];
    visible = true;
    animateMode = true;
    enableAll = function() {
      var len, m, results, set;
      results = [];
      for (m = 0, len = sets.length; m < len; m++) {
        set = sets[m];
        results.push(set.enabled = visible && animateMode);
      }
      return results;
    };
    Tick(function(time, dt) {
      var f, len, m, results, s, set;
      if (visible && animateMode) {
        results = [];
        for (m = 0, len = sets.length; m < len; m++) {
          set = sets[m];
          if (set.parentScope.visible) {
            f = dt * Config.SPEED;
            s = Config.SCALE;
            results.push(set.update(f, s));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    });
    Reaction("Schematic:Hide", function() {
      return setTimeout(function() {
        return enableAll(animateMode = true);
      });
    });
    Reaction("Schematic:Show", function() {
      return enableAll(animateMode = false);
    });
    Reaction("FlowArrows:Show", function() {
      return enableAll(visible = true);
    });
    Reaction("FlowArrows:Hide", function() {
      return enableAll(visible = false);
    });
    return Make("FlowArrows", Config.wrap(function() {
      var elm, lineData, parentScope, set, setData;
      parentScope = arguments[0], lineData = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      elm = parentScope.element;
      if (elm.querySelector("[id^=markerBox]")) {
        while (elm.hasChildNodes()) {
          elm.removeChild(elm.firstChild);
        }
      }
      setData = Process(lineData);
      set = Set(elm, setData);
      set.parentScope = parentScope;
      sets.push(set);
      return set;
    }));
  });

  Take("FlowArrows:Config", function(Config) {
    var angle, cullInlinePoints, cullShortEdges, cullShortSegments, distance, formSegments, isConnected, isInline, joinSegments, log, reifySegments, reifyVectors, wrap;
    Make("FlowArrows:Process", function(lineData) {
      return wrap(lineData).process(formSegments).process(joinSegments).process(cullShortEdges).process(cullInlinePoints).process(reifyVectors).process(reifySegments).process(cullShortSegments).result;
    });
    log = function(a) {
      console.dir(a);
      return a;
    };
    formSegments = function(lineData) {
      var i, m, pointA, pointB, ref, segmentEdges, segments;
      segments = [];
      segmentEdges = null;
      for (i = m = 0, ref = lineData.length; m < ref; i = m += 2) {
        pointA = lineData[i];
        pointB = lineData[i + 1];
        if ((segmentEdges != null) && isConnected(pointA, segmentEdges[segmentEdges.length - 1])) {
          segmentEdges.push(pointB);
        } else if ((segmentEdges != null) && isConnected(pointB, segmentEdges[segmentEdges.length - 1])) {
          segmentEdges.push(pointA);
        } else if ((segmentEdges != null) && isConnected(segmentEdges[0], pointB)) {
          segmentEdges.unshift(pointA);
        } else if ((segmentEdges != null) && isConnected(segmentEdges[0], pointA)) {
          segmentEdges.unshift(pointB);
        } else {
          segments.push(segmentEdges = [pointA, pointB]);
        }
      }
      return segments;
    };
    joinSegments = function(segments) {
      var i, j, pointA, pointB, segA, segB;
      segA = null;
      segB = null;
      pointA = null;
      pointB = null;
      i = segments.length;
      while (i--) {
        j = segments.length;
        while (--j > i) {
          segA = segments[i];
          segB = segments[j];
          pointA = segA[0];
          pointB = segB[0];
          if (isConnected(pointA, pointB)) {
            segB.reverse();
            segB.pop();
            segments[i] = segB.concat(segA);
            segments.splice(j, 1);
            continue;
          }
          pointA = segA[segA.length - 1];
          pointB = segB[segB.length - 1];
          if (isConnected(pointA, pointB)) {
            segB.reverse();
            segB.unshift();
            segments[i] = segA.concat(segB);
            segments.splice(j, 1);
            continue;
          }
          pointA = segA[segA.length - 1];
          pointB = segB[0];
          if (isConnected(pointA, pointB)) {
            segments[i] = segA.concat(segB);
            segments.splice(j, 1);
            continue;
          }
          pointA = segA[0];
          pointB = segB[segB.length - 1];
          if (isConnected(pointA, pointB)) {
            segments[i] = segB.concat(segA);
            segments.splice(j, 1);
            continue;
          }
        }
      }
      return segments;
    };
    cullShortEdges = function(segments) {
      var i, j, pointA, pointB, seg;
      i = segments.length;
      seg = [];
      pointA = pointB = null;
      while (i--) {
        seg = segments[i];
        j = seg.length - 1;
        while (j-- > 0) {
          pointA = seg[j];
          pointB = seg[j + 1];
          if (distance(pointA, pointB) < Config.MIN_EDGE_LENGTH) {
            pointA.cull = true;
          }
        }
      }
      i = segments.length;
      while (i--) {
        seg = segments[i];
        j = seg.length - 1;
        while (j-- > 0) {
          if (seg[j].cull) {
            seg.splice(j, 1);
          }
        }
      }
      return segments;
    };
    cullInlinePoints = function(segments) {
      var i, j, pointA, pointB, pointC, seg;
      seg = [];
      pointA = null;
      pointB = null;
      pointC = null;
      i = segments.length;
      while (i--) {
        seg = segments[i];
        j = seg.length - 2;
        while (j-- > 0 && seg.length > 2) {
          pointA = seg[j];
          pointB = seg[j + 1];
          pointC = seg[j + 2];
          if (isInline(pointA, pointB, pointC)) {
            seg.splice(j + 1, 1);
          }
        }
      }
      return segments;
    };
    reifyVectors = function(segments) {
      var i, len, m, pointA, pointB, results, segment, vector;
      results = [];
      for (m = 0, len = segments.length; m < len; m++) {
        segment = segments[m];
        results.push((function() {
          var len1, n, results1;
          results1 = [];
          for (i = n = 0, len1 = segment.length; n < len1; i = ++n) {
            pointA = segment[i];
            if (pointB = segment[i + 1]) {
              results1.push(vector = {
                x: pointA.x,
                y: pointA.y,
                dist: distance(pointA, pointB),
                angle: angle(pointA, pointB)
              });
            }
          }
          return results1;
        })());
      }
      return results;
    };
    reifySegments = function(set) {
      var dist, len, len1, m, n, results, segment, segmentVectors, vector;
      results = [];
      for (m = 0, len = set.length; m < len; m++) {
        segmentVectors = set[m];
        dist = 0;
        for (n = 0, len1 = segmentVectors.length; n < len1; n++) {
          vector = segmentVectors[n];
          dist += vector.dist;
        }
        results.push(segment = {
          vectors: segmentVectors,
          dist: dist
        });
      }
      return results;
    };
    cullShortSegments = function(set) {
      return set.filter(function(segment) {
        return segment.dist >= Config.MIN_SEGMENT_LENGTH;
      });
    };
    wrap = function(data) {
      return {
        process: function(fn) {
          return wrap(fn(data));
        },
        result: data
      };
    };
    isConnected = function(a, b) {
      var dX, dY;
      dX = Math.abs(a.x - b.x);
      dY = Math.abs(a.y - b.y);
      return dX < Config.CONNECTED_DISTANCE && dY < Config.CONNECTED_DISTANCE;
    };
    isInline = function(a, b, c) {
      var crossproduct, dotproduct, squaredlengthba;
      crossproduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
      if (Math.abs(crossproduct) > 0.01) {
        return false;
      }
      dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
      if (dotproduct < 0) {
        return false;
      }
      squaredlengthba = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
      if (dotproduct > squaredlengthba) {
        return false;
      }
      return true;
    };
    distance = function(a, b) {
      var dx, dy;
      dx = b.x - a.x;
      dy = b.y - a.y;
      return Math.sqrt(dx * dx + dy * dy);
    };
    return angle = function(a, b) {
      return Math.atan2(b.y - a.y, b.x - a.x);
    };
  });

  Take(["FlowArrows:Arrow", "FlowArrows:Config", "FlowArrows:Containerize"], function(Arrow, Config, Containerize) {
    return Make("FlowArrows:Segment", function(parentElm, segmentData) {
      return Containerize(parentElm, function(scope) {
        var arrow, arrowCount, i, m, ref, results, segmentPosition, segmentSpacing, vector, vectorIndex, vectorPosition;
        arrowCount = Math.max(1, Math.round(segmentData.dist / Config.SPACING));
        segmentSpacing = segmentData.dist / arrowCount;
        segmentPosition = 0;
        vectorPosition = 0;
        vectorIndex = 0;
        vector = segmentData.vectors[vectorIndex];
        results = [];
        for (i = m = 0, ref = arrowCount; 0 <= ref ? m < ref : m > ref; i = 0 <= ref ? ++m : --m) {
          while (vectorPosition > vector.dist) {
            vectorPosition -= vector.dist;
            vector = segmentData.vectors[++vectorIndex];
          }
          arrow = Arrow(scope.element, segmentData, segmentPosition, vectorPosition, vectorIndex);
          vectorPosition += segmentSpacing;
          segmentPosition += segmentSpacing;
          results.push(arrow);
        }
        return results;
      });
    });
  });

  Take(["Dev", "FlowArrows:Config", "FlowArrows:Containerize", "FlowArrows:Segment"], function(Dev, Config, Containerize, Segment) {
    return Make("FlowArrows:Set", function(parentElm, setData) {
      return Containerize(parentElm, function(scope) {
        var child, childName, i, len, m, results, segmentData;
        results = [];
        for (i = m = 0, len = setData.length; m < len; i = ++m) {
          segmentData = setData[i];
          if (segmentData.dist < Config.FADE_LENGTH * 2) {
            throw "You have a FlowArrows segment that is only " + (Math.round(segmentData.dist)) + " units long, which is clashing with your fade length of " + Config.FADE_LENGTH + " units. Please don't set MIN_SEGMENT_LENGTH less than FADE_LENGTH * 2.";
          }
          childName = "segment" + i;
          child = Segment(scope.element, segmentData);
          if (Dev) {
            child.element.addEventListener("click", function() {
              return console.log(parentElm._scope.instanceName + "." + childName);
            });
          }
          results.push(scope[childName] = child);
        }
        return results;
      });
    });
  });

  Take(["GUI", "Resize", "SVG", "TopBar", "TRS", "SVGReady"], function(GUI, Resize, SVG, TopBar, TRS) {
    var g, hide, show;
    g = TRS(SVG.create("g", GUI.elm));
    SVG.create("rect", g, {
      x: -200,
      y: -30,
      width: 400,
      height: 60,
      rx: 30,
      ry: 30,
      fill: "#222",
      "fill-opacity": 0.9
    });
    SVG.create("text", g, {
      y: 22,
      textContent: "Click To Focus",
      "font-size": 20,
      fill: "#FFF",
      "text-anchor": "middle"
    });
    show = function() {
      return SVG.attrs(g, {
        style: "display: block"
      });
    };
    hide = function() {
      return SVG.attrs(g, {
        style: "display: none"
      });
    };
    Resize(function() {
      return TRS.abs(g, {
        x: window.innerWidth / 2,
        y: TopBar.height
      });
    });
    window.addEventListener("focus", hide);
    window.addEventListener("touchstart", hide);
    window.addEventListener("blur", show);
    window.focus();
    return hide();
  });

  (function() {
    window.addEventListener("touchmove", function(e) {
      return e.preventDefault();
    });
    window.addEventListener("scroll", function(e) {
      return e.preventDefault();
    });
    return window.addEventListener("dragstart", function(e) {
      return e.preventDefault();
    });
  })();

  Take(["Dev", "GUI", "Resize", "SVG", "Tick", "SVGReady"], function(Dev, GUI, Resize, SVG, Tick) {
    var avgLength, avgList, count, freq, text, total;
    if (!Dev) {
      return;
    }
    count = 60;
    freq = 1;
    avgLength = 10;
    avgList = [];
    total = 0;
    text = SVG.create("text", GUI.elm, {
      fill: "#666"
    });
    Resize(function() {
      return SVG.attrs(text, {
        x: 10,
        y: 70
      });
    });
    return Tick(function(time, dt) {
      var fps;
      avgList.push(1 / dt);
      total += 1 / dt;
      if (avgList.length > avgLength) {
        total -= avgList.shift();
      }
      fps = Math.min(60, Math.ceil(total / avgList.length));
      if (++count / fps >= freq) {
        count = 0;
        return SVG.attrs(text, {
          textContent: "FPS: " + fps
        });
      }
    });
  });

  Take(["SVG", "SVGReady"], function(SVG) {
    var GUI;
    return Make("GUI", GUI = {
      elm: SVG.create("g", SVG.root, {
        "x-gui": ""
      }),
      TopBar: {
        buttonPadCustom: 16,
        buttonPadStandard: 24,
        height: 48,
        iconPad: 6,
        Help: {
          inset: 88
        },
        Menu: {
          inset: -4
        },
        Settings: {
          inset: 200
        }
      },
      ControlPanel: {
        width: 240,
        unit: 48,
        padX: 12,
        padY: 12,
        borderRadius: 8
      }
    });
  });

  Take(["GUI", "Pressure", "Reaction", "Resize", "SVG", "TRS", "Tween1", "SVGReady"], function(GUI, Pressure, Reaction, Resize, SVG, TRS, Tween1) {
    var alpha, atmLabel, atmRect, g, maxLabel, maxRect, medLabel, medRect, minLabel, minRect, pressures, tick, title, u, vacLabel, vacRect;
    u = 36;
    g = TRS(SVG.create("g", GUI.elm));
    pressures = TRS(SVG.create("g", g));
    TRS.move(pressures, -84, 0);
    title = SVG.create("text", pressures, {
      x: 84,
      y: 0,
      "text-anchor": "middle",
      textContent: "What do the colors mean?",
      "font-size": 24
    });
    vacRect = SVG.create("rect", pressures, {
      x: 0,
      y: 0 * u + 20,
      width: u,
      height: u,
      fill: Pressure(Pressure.vacuum)
    });
    atmRect = SVG.create("rect", pressures, {
      x: 0,
      y: 1 * u + 20,
      width: u,
      height: u,
      fill: Pressure(Pressure.drain)
    });
    minRect = SVG.create("rect", pressures, {
      x: 0,
      y: 2 * u + 20,
      width: u,
      height: u,
      fill: Pressure(Pressure.min)
    });
    medRect = SVG.create("rect", pressures, {
      x: 0,
      y: 3 * u + 20,
      width: u,
      height: u,
      fill: Pressure(Pressure.med)
    });
    maxRect = SVG.create("rect", pressures, {
      x: 0,
      y: 4 * u + 20,
      width: u,
      height: u,
      fill: Pressure(Pressure.max)
    });
    vacLabel = SVG.create("text", pressures, {
      x: u + 8,
      y: 1 * u + 10,
      "text-anchor": "start",
      textContent: "Suction Pressure"
    });
    atmLabel = SVG.create("text", pressures, {
      x: u + 8,
      y: 2 * u + 10,
      "text-anchor": "start",
      textContent: "Drain Pressure"
    });
    minLabel = SVG.create("text", pressures, {
      x: u + 8,
      y: 3 * u + 10,
      "text-anchor": "start",
      textContent: "Low Pressure"
    });
    medLabel = SVG.create("text", pressures, {
      x: u + 8,
      y: 4 * u + 10,
      "text-anchor": "start",
      textContent: "Medium Pressure"
    });
    maxLabel = SVG.create("text", pressures, {
      x: u + 8,
      y: 5 * u + 10,
      "text-anchor": "start",
      textContent: "High Pressure"
    });
    Resize(function() {
      var x, y;
      x = window.innerWidth / 2;
      y = GUI.TopBar.height * 2;
      return TRS.abs(g, {
        x: x,
        y: y
      });
    });
    alpha = 1;
    (tick = function(v) {
      alpha = v;
      return SVG.styles(g, {
        opacity: v * 2 - 1
      });
    })(0);
    Reaction("Help:Show", function() {
      return Tween1(alpha, 1, 1.2, tick);
    });
    return Reaction("Help:Hide", function() {
      return Tween1(alpha, 0, 1.2, tick);
    });
  });

  (function() {
    return Make("Input", function(elm, calls) {
      var down, mouseleave, mousemove, mouseup, move, out, over, prepTouchEvent, state, touchend, touchmove, up;
      state = {
        down: false,
        over: false,
        touch: false
      };
      over = function(e) {
        state.over = true;
        return typeof calls.over === "function" ? calls.over(e) : void 0;
      };
      down = function(e) {
        state.down = true;
        return typeof calls.down === "function" ? calls.down(e) : void 0;
      };
      move = function(e) {
        if (state.down && (calls.drag != null)) {
          return calls.drag(e);
        } else {
          return typeof calls.move === "function" ? calls.move(e) : void 0;
        }
      };
      up = function(e) {
        state.down = false;
        if (state.over) {
          if (typeof calls.click === "function") {
            calls.click(e);
          }
        } else {
          if (typeof calls.miss === "function") {
            calls.miss(e);
          }
        }
        return typeof calls.up === "function" ? calls.up(e) : void 0;
      };
      out = function(e) {
        state.over = false;
        return typeof calls.out === "function" ? calls.out(e) : void 0;
      };
      elm.addEventListener("mouseenter", function(e) {
        if (state.touch) {
          return;
        }
        over(e);
        return elm.addEventListener("mouseleave", mouseleave);
      });
      elm.addEventListener("mousedown", function(e) {
        if (state.touch) {
          return;
        }
        down(e);
        elm.addEventListener("mousemove", mousemove);
        return window.addEventListener("mouseup", mouseup);
      });
      mousemove = function(e) {
        if (state.touch) {
          return;
        }
        return move(e);
      };
      mouseup = function(e) {
        if (state.touch) {
          return;
        }
        up(e);
        elm.removeEventListener("mousemove", mousemove);
        return window.removeEventListener("mouseup", mouseup);
      };
      mouseleave = function(e) {
        if (state.touch) {
          return;
        }
        out(e);
        return elm.removeEventListener("mouseleave", mouseleave);
      };
      prepTouchEvent = function(e) {
        var ref, ref1;
        state.touch = true;
        e.clientX = (ref = e.touches[0]) != null ? ref.clientX : void 0;
        return e.clientY = (ref1 = e.touches[0]) != null ? ref1.clientY : void 0;
      };
      elm.addEventListener("touchstart", function(e) {
        prepTouchEvent(e);
        over(e);
        down(e);
        elm.addEventListener("touchmove", touchmove);
        elm.addEventListener("touchend", touchend);
        return elm.addEventListener("touchcancel", touchend);
      });
      touchmove = function(e) {
        var isOver;
        prepTouchEvent(e);
        isOver = true;
        if (isOver && !state.over) {
          over(e);
        }
        if (isOver) {
          move(e);
        }
        if (!isOver && state.over) {
          return out(e);
        }
      };
      return touchend = function(e) {
        prepTouchEvent(e);
        up(e);
        elm.removeEventListener("touchmove", touchmove);
        elm.removeEventListener("touchend", touchend);
        return elm.removeEventListener("touchcancel", touchend);
      };
    });
  })();

  Take(["Reaction", "SVG", "Tween1", "ScopeReady"], function(Reaction, SVG, Tween1) {
    var root;
    root = document.querySelector("#root");
    Reaction("Root:Show", function() {
      return root._scope.show(1);
    });
    return Reaction("Root:Hide", function() {
      return root._scope.hide(1);
    });
  });

  Take(["Action", "Control", "GUI", "Pressure", "Reaction", "Resize", "SVG", "TRS", "Tween1", "ScopeReady"], function(Action, Control, GUI, Pressure, Reaction, Resize, SVG, TRS, Tween1) {
    var alpha, g, slider, sliders, tick;
    g = TRS(SVG.create("g", GUI.elm));
    sliders = TRS(SVG.create("g", g, {
      "text-anchor": "middle"
    }));
    TRS.move(sliders, -128);
    slider = Control({
      name: "Background",
      type: "Slider",
      parent: sliders,
      change: function(v) {
        return Action("Background:Set", v * .7 + 0.3);
      }
    });
    Reaction("Background:Set", function(v) {
      return slider.set((v - .3) / .7);
    });
    Resize(function() {
      var x, y;
      x = window.innerWidth / 2;
      y = GUI.TopBar.height * 2;
      return TRS.abs(g, {
        x: x,
        y: y
      });
    });
    alpha = 1;
    (tick = function(v) {
      alpha = v;
      return SVG.styles(g, {
        opacity: alpha * 2 - 1
      });
    })(0);
    Reaction("Settings:Show", function() {
      return Tween1(alpha, 1, 1.2, tick);
    });
    return Reaction("Settings:Hide", function() {
      return Tween1(alpha, 0, 1.2, tick);
    });
  });

  Take(["Component", "GUI", "Input", "Reaction", "Resize", "SVG", "TRS", "SVGReady"], function(Component, GUI, Input, Reaction, Resize, SVG, TRS) {
    var TopBar, bg, construct, container, help, instances, menu, offsetX, requested, resize, settings, topBar;
    requested = [];
    instances = {};
    menu = null;
    settings = null;
    help = null;
    offsetX = 0;
    topBar = SVG.create("g", GUI.elm, {
      "class": "TopBar"
    });
    bg = SVG.create("rect", topBar, {
      height: GUI.TopBar.height,
      fill: "url(#TopBarGradient)"
    });
    SVG.createGradient("TopBarGradient", false, "#35488d", "#5175bd", "#35488d");
    container = TRS(SVG.create("g", topBar, {
      "class": "Elements"
    }));
    Take("ScopeReady", function() {
      return SVG.append(GUI.elm, topBar);
    });
    TopBar = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (typeof args[1] === "object") {
        return Component.make.apply(Component, ["TopBar"].concat(slice.call(args)));
      } else {
        return requested.push.apply(requested, args);
      }
    };
    TopBar.height = GUI.TopBar.height;
    Take("ScopeReady", function() {
      var definitions, i, len, m, name;
      definitions = Component.take("TopBar");
      for (i = m = 0, len = requested.length; m < len; i = ++m) {
        name = requested[i];
        construct(i, name, definitions[name]);
      }
      menu = construct(-1, "Menu", definitions["Menu"]);
      settings = construct(-1, "Settings", definitions["Settings"]);
      help = construct(-1, "Help", definitions["Help"]);
      return Resize(resize);
    });
    resize = function() {
      var base, instance, len, m;
      SVG.attrs(bg, {
        width: window.innerWidth
      });
      TRS.move(container, window.innerWidth / 2 - offsetX / 2);
      for (m = 0, len = instances.length; m < len; m++) {
        instance = instances[m];
        if (typeof (base = instance.api).resize === "function") {
          base.resize();
        }
      }
      TRS.move(menu.element, GUI.TopBar.Menu.inset);
      TRS.move(help.element, window.innerWidth - GUI.TopBar.Help.inset);
      return TRS.move(settings.element, window.innerWidth - GUI.TopBar.Settings.inset);
    };
    construct = function(i, name, api) {
      var buttonPad, buttonWidth, custom, iconRect, iconX, iconY, instance, source, textRect, textX;
      if (api == null) {
        throw "Unknown TopBar button name: " + name;
      }
      source = document.getElementById(name.toLowerCase());
      if (source == null) {
        throw "TopBar icon not found for id: #" + name;
      }
      custom = i === -1;
      buttonPad = custom ? GUI.TopBar.buttonPadCustom : GUI.TopBar.buttonPadStandard;
      if (custom) {
        api.element = TRS(SVG.create("g", topBar, {
          "class": "Element",
          ui: true
        }));
      } else {
        api.element = TRS(SVG.create("g", container, {
          "class": "Element",
          ui: true
        }));
      }
      instance = {
        element: api.element,
        i: i,
        name: name,
        api: api
      };
      if (!custom) {
        instances[name] = instance;
      }
      if (api.bg == null) {
        api.bg = SVG.create("rect", api.element, {
          "class": "BG",
          height: GUI.TopBar.height,
          fill: "transparent"
        });
      }
      if (api.icon == null) {
        api.icon = TRS(SVG.clone(source, api.element));
      }
      if (api.text == null) {
        api.text = TRS(SVG.create("text", api.element, {
          "font-size": 14,
          fill: "#FFF",
          textContent: api.label || name
        }));
      }
      iconRect = api.icon.getBoundingClientRect();
      textRect = api.text.getBoundingClientRect();
      iconX = buttonPad;
      iconY = 0;
      textX = buttonPad + iconRect.width + GUI.TopBar.iconPad;
      buttonWidth = textX + textRect.width + buttonPad;
      TRS.abs(api.icon, {
        x: iconX,
        y: iconY
      });
      TRS.move(api.text, textX, GUI.TopBar.height / 2 + textRect.height / 2 - 4);
      SVG.attrs(api.bg, {
        width: buttonWidth
      });
      if (!custom) {
        TRS.move(api.element, offsetX);
        offsetX += buttonWidth;
      }
      if (typeof api.setup === "function") {
        api.setup(api.element);
      }
      Input(api.element, {
        over: function() {
          if (api.over != null) {
            return api.over();
          }
        },
        down: function() {
          if (api.down != null) {
            return api.down();
          }
        },
        move: function() {
          if (api.move != null) {
            return api.move();
          }
        },
        click: function() {
          if (api.click != null) {
            return api.click();
          }
        },
        up: function() {
          if (api.up != null) {
            return api.up();
          }
        },
        out: function() {
          if (api.out != null) {
            return api.out();
          }
        }
      });
      return instance;
    };
    return Make("TopBar", TopBar);
  });

  Take(["Dev", "RAF", "Tween1", "AllReady"], function(Dev, RAF, Tween1) {
    if (Dev) {
      return RAF(function() {
        return document.rootElement.style.opacity = 1;
      });
    } else {
      return Tween1(0, 1, .5, function(v) {
        return document.rootElement.style.opacity = v;
      });
    }
  });

  Take("SVG", function(SVG) {
    var Highlighter;
    return Make("Highlighter", Highlighter = {
      setup: function() {
        throw "Highligher has been removed from SVGA. Please remove the calls to Highligher.setup() from your animation.";
      },
      enable: function() {
        throw "Highligher has been removed from SVGA. Please remove the calls to Highligher.enable() from your animation.";
      },
      disable: function() {
        throw "Highligher has been removed from SVGA. Please remove the calls to Highligher.disable() from your animation.";
      }
    });
  });

  (function() {
    return Make("Mask", function() {
      throw "Mask has been removed. Please find a different way to acheive your desired effect.";
    });
  })();

  Take(["Nav"], function(Nav) {
    window.addEventListener("gesturestart", function(e) {
      if (Nav.eventInside(e)) {
        e.preventDefault();
        return Nav.startScale();
      }
    });
    return window.addEventListener("gesturechange", function(e) {
      if (Nav.eventInside(e)) {
        e.preventDefault();
        return Nav.scale(e.scale);
      }
    });
  });

  Take(["KeyMe", "Nav", "Tick"], function(KeyMe, Nav, Tick) {
    var accel, decel, getAccel, maxVel, vel;
    decel = 1.25;
    maxVel = {
      xy: 10,
      z: 0.05
    };
    accel = {
      xy: 0.7,
      z: 0.004
    };
    vel = {
      a: 0,
      d: 0,
      z: 0
    };
    Tick(function() {
      var down, inputX, inputY, inputZ, left, minus, plus, right, up;
      left = KeyMe.pressing["left"];
      right = KeyMe.pressing["right"];
      up = KeyMe.pressing["up"];
      down = KeyMe.pressing["down"];
      plus = KeyMe.pressing["equals"];
      minus = KeyMe.pressing["minus"];
      inputX = getAccel(left, right);
      inputY = getAccel(up, down);
      inputZ = getAccel(plus, minus);
      if (inputZ === 0) {
        vel.z /= decel;
      }
      vel.z = Math.max(-maxVel.z, Math.min(maxVel.z, vel.z + accel.z * inputZ));
      if (inputX === 0 && inputY === 0) {
        vel.d /= decel;
      }
      if (inputY || inputX) {
        vel.a = Math.atan2(inputY, inputX);
      }
      vel.d = Math.min(maxVel.xy, vel.d + accel.xy * (Math.abs(inputX) + Math.abs(inputY)));
      return Nav.by({
        x: Math.cos(vel.a) * vel.d,
        y: Math.sin(vel.a) * vel.d,
        z: vel.z
      });
    });
    return getAccel = function(pos, neg) {
      if (pos && !neg) {
        return 1;
      }
      if (neg && !pos) {
        return -1;
      }
      return 0;
    };
  });

  Take(["Nav"], function(Nav) {
    var down, lastX, lastY;
    lastX = 0;
    lastY = 0;
    down = false;
    window.addEventListener("mousedown", function(e) {
      e.preventDefault();
      down = true;
      lastX = e.clientX;
      return lastY = e.clientY;
    });
    window.addEventListener("mousemove", function(e) {
      if (down && Nav.eventInside(e)) {
        Nav.by({
          x: e.clientX - lastX,
          y: e.clientY - lastY
        });
        lastX = e.clientX;
        return lastY = e.clientY;
      }
    });
    window.addEventListener("mouseup", function(e) {
      return down = false;
    });
    window.addEventListener("dblclick", function(e) {
      if (Nav.eventInside(e)) {
        e.preventDefault();
        return Nav.to({
          x: 0,
          y: 0,
          z: 0
        });
      }
    });
    return window.addEventListener("wheel", function(e) {
      if (Nav.eventInside(e)) {
        e.preventDefault();
        if (e.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
          if (e.ctrlKey) {
            return Nav.by({
              z: -e.deltaY / 100
            });
          } else if (e.metaKey) {
            return Nav.by({
              z: -e.deltaY / 200
            });
          } else {
            return Nav.by({
              x: -e.deltaX,
              y: -e.deltaY,
              z: -e.deltaZ
            });
          }
        } else {
          return Nav.by({
            z: -e.deltaY / 200
          });
        }
      }
    });
  });

  Take(["GUI", "RAF", "Resize", "SVG", "Tween", "ScopeReady"], function(GUI, RAF, Resize, SVG, Tween) {
    var Nav, center, dist, distTo, initialSize, limit, nav, ox, oy, pos, render, requestRender, root, scaleStartPosZ, xLimit, yLimit, zLimit, zoom;
    pos = {
      x: 0,
      y: 0,
      z: 0
    };
    center = {
      x: 0,
      y: 0,
      z: 1
    };
    xLimit = {};
    yLimit = {};
    zLimit = {
      min: 0,
      max: 3
    };
    scaleStartPosZ = 0;
    zoom = SVG.create("g", null, {
      "x-zoom": ""
    });
    nav = SVG.create("g", zoom, {
      "x-nav": ""
    });
    root = document.getElementById("root");
    SVG.prepend(document.rootElement, zoom);
    SVG.append(nav, root);
    initialSize = root.getBoundingClientRect();
    ox = root._scope.x - initialSize.left - initialSize.width / 2;
    oy = root._scope.y - initialSize.top - initialSize.height / 2;
    xLimit.max = initialSize.width / 2;
    yLimit.max = initialSize.height / 2;
    xLimit.min = -xLimit.max;
    yLimit.min = -yLimit.max;
    Resize(function() {
      var hFrac, height, wFrac, width;
      width = window.innerWidth - GUI.ControlPanel.width;
      height = window.innerHeight - GUI.TopBar.height;
      wFrac = width / initialSize.width;
      hFrac = height / initialSize.height;
      center.x = width / 2;
      center.y = height / 2 + GUI.TopBar.height;
      center.z = .9 * Math.min(wFrac, hFrac);
      return render();
    });
    requestRender = function() {
      return RAF(render, true);
    };
    render = function() {
      var z;
      z = center.z * Math.pow(2, pos.z);
      SVG.attr(nav, "transform", "translate(" + (pos.x + ox) + "," + (pos.y + oy) + ")");
      return SVG.attr(zoom, "transform", "translate(" + center.x + "," + center.y + ") scale(" + z + ")");
    };
    limit = function(l, v) {
      return Math.min(l.max, Math.max(l.min, v));
    };
    Make("Nav", Nav = {
      to: function(p) {
        var target, time;
        target = {
          x: p.x != null ? p.x : pos.x,
          y: p.y != null ? p.y : pos.y,
          z: p.z != null ? p.z : pos.z
        };
        time = Math.sqrt(distTo(pos, target)) / 30;
        if (time > 0) {
          return Tween({
            on: pos,
            to: target,
            time: time,
            tick: requestRender
          });
        }
      },
      by: function(p) {
        var scale;
        if (p.z != null) {
          pos.z = limit(zLimit, pos.z + p.z);
        }
        scale = center.z * Math.pow(2, pos.z);
        if (p.x != null) {
          pos.x = limit(xLimit, pos.x + p.x / scale);
        }
        if (p.y != null) {
          pos.y = limit(yLimit, pos.y + p.y / scale);
        }
        return requestRender();
      },
      startScale: function() {
        return scaleStartPosZ = pos.z;
      },
      scale: function(s) {
        pos.z = limit(zLimit, Math.log2(Math.pow(2, scaleStartPosZ) * s));
        return requestRender();
      },
      eventInside: function(e) {
        var a, ref;
        if (((ref = e.touches) != null ? ref.length : void 0) > 0) {
          e = e.touches[0];
        }
        a = e.target === document.rootElement || zoom.contains(e.target);
        return a;
      }
    });
    distTo = function(a, b) {
      var dx, dy, dz;
      dx = a.x - b.x;
      dy = a.y - b.y;
      dz = 200 * a.z - b.z;
      return dist(dx, dy, dz);
    };
    return dist = function(x, y, z) {
      if (z == null) {
        z = 0;
      }
      return Math.sqrt(x * x + y * y + z * z);
    };
  });

  Take(["Nav"], function(Nav) {
    var cloneTouches, distTouches, lastTouches, touchMove, touchStart;
    lastTouches = null;
    window.addEventListener("touchstart", touchStart = function(e) {
      if (Nav.eventInside(e)) {
        e.preventDefault();
        return cloneTouches(e);
      }
    });
    window.addEventListener("touchmove", touchMove = function(e) {
      var a, b;
      if (Nav.eventInside(e)) {
        e.preventDefault();
        if (e.touches.length !== lastTouches.length) {

        } else if (e.touches.length > 1) {
          a = distTouches(lastTouches);
          b = distTouches(e.touches);
          Nav.by({
            z: (b - a) / 200
          });
        } else {
          Nav.by({
            x: e.touches[0].clientX - lastTouches[0].clientX,
            y: e.touches[0].clientY - lastTouches[0].clientY
          });
        }
        return cloneTouches(e);
      }
    });
    cloneTouches = function(e) {
      var t;
      return lastTouches = (function() {
        var len, m, ref, results;
        ref = e.touches;
        results = [];
        for (m = 0, len = ref.length; m < len; m++) {
          t = ref[m];
          results.push({
            clientX: t.clientX,
            clientY: t.clientY
          });
        }
        return results;
      })();
    };
    return distTouches = function(touches) {
      var a, b, dx, dy;
      a = touches[0];
      b = touches[1];
      dx = a.clientX - b.clientX;
      dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
  });

  if ((base = SVGElement.prototype).contains == null) {
    base.contains = function(root, node) {
      while (node) {
        if (node === root) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    };
  }

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var root, schematic, update;
    root = true;
    schematic = false;
    update = function() {
      if (root && !schematic) {
        return Action("ControlPanel:Show");
      } else {
        return Action("ControlPanel:Hide");
      }
    };
    Reaction("Schematic:Hide", function() {
      return update(schematic = false);
    });
    Reaction("Schematic:Show", function() {
      return update(schematic = true);
    });
    Reaction("Root:Hide", function() {
      return update(root = false);
    });
    return Reaction("Root:Show", function() {
      return update(root = true);
    });
  });

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var showing;
    showing = false;
    Reaction("FlowArrows:Hide", function() {
      return showing = false;
    });
    Reaction("FlowArrows:Show", function() {
      return showing = true;
    });
    Reaction("FlowArrows:Toggle", function() {
      return Action(showing ? "FlowArrows:Hide" : "FlowArrows:Show");
    });
    return Take("AllReady", function() {
      return Action("FlowArrows:Show");
    });
  });

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var showing;
    showing = false;
    Reaction("Help:Hide", function() {
      return showing = false;
    });
    Reaction("Help:Show", function() {
      return showing = true;
    });
    Reaction("Help:Toggle", function() {
      return Action(showing ? "Help:Hide" : "Help:Show");
    });
    return Reaction("Settings:Show", function() {
      return Action("Help:Hide");
    });
  });

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var showing;
    showing = false;
    Reaction("Labels:Hide", function() {
      return showing = false;
    });
    Reaction("Labels:Show", function() {
      return showing = true;
    });
    return Reaction("Labels:Toggle", function() {
      return Action(showing ? "Labels:Hide" : "Labels:Show");
    });
  });

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var help, settings, update;
    help = false;
    settings = false;
    update = function() {
      if (help || settings) {
        return Action("Root:Hide");
      } else {
        return Action("Root:Show");
      }
    };
    Reaction("Help:Show", function() {
      return update(help = true);
    });
    Reaction("Help:Hide", function() {
      return update(help = false);
    });
    Reaction("Settings:Show", function() {
      return update(settings = true);
    });
    return Reaction("Settings:Hide", function() {
      return update(settings = false);
    });
  });

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var schematicMode;
    schematicMode = true;
    Reaction("Schematic:Hide", function() {
      return schematicMode = false;
    });
    Reaction("Schematic:Show", function() {
      return schematicMode = true;
    });
    Reaction("Schematic:Toggle", function() {
      return Action(schematicMode ? "Schematic:Hide" : "Schematic:Show");
    });
    return Take("AllReady", function() {
      return Action("Schematic:Hide");
    });
  });

  Take(["Action", "Reaction"], function(Action, Reaction) {
    var showing;
    showing = false;
    Reaction("Settings:Hide", function() {
      return showing = false;
    });
    Reaction("Settings:Show", function() {
      return showing = true;
    });
    Reaction("Settings:Toggle", function() {
      return Action(showing ? "Settings:Hide" : "Settings:Show");
    });
    return Reaction("Help:Show", function() {
      return Action("Settings:Hide");
    });
  });

  Take(["Dev", "AllReady"], function(Dev) {
    var elm, len, m, nodes, results;
    if (!Dev) {
      return;
    }
    nodes = Array.prototype.slice.call(document.querySelectorAll("#root [id]"));
    results = [];
    for (m = 0, len = nodes.length; m < len; m++) {
      elm = nodes[m];
      results.push(elm.removeAttribute("id"));
    }
    return results;
  });

  Take(["Reaction", "Registry", "Tick"], function(Reaction, Registry, Tick) {
    return Registry.add("ScopeProcessor", function(scope) {
      var animate, running, startTime;
      if (scope.animate == null) {
        return;
      }
      running = false;
      startTime = 0;
      animate = scope.animate;
      scope.animate = function() {
        throw "@animate() is called by the system. Please don't call it yourself.";
      };
      Tick(function(time, dt) {
        if (!running) {
          return;
        }
        return animate.call(scope, dt, time - startTime);
      });
      Reaction("Schematic:Hide", function() {
        startTime = ((typeof performance !== "undefined" && performance !== null ? performance.now() : void 0) || 0) / 1000;
        return running = true;
      });
      return Reaction("Schematic:Show", function() {
        return running = false;
      });
    });
  });

  Take(["Registry", "ScopeCheck"], function(Registry, ScopeCheck) {
    return Registry.add("ScopeProcessor", function(scope) {
      ScopeCheck(scope, "getElement", "getPressure", "setPressure", "getPressureColor", "setText", "FlowArrows", "cx", "cy", "angle", "turns", "transform");
      scope.getElement = function() {
        throw "@getElement() has been removed. Please use @element instead.";
      };
      scope.getPressure = function() {
        throw "@getPressure() has been removed. Please use @pressure instead.";
      };
      scope.setPressure = function() {
        throw "@setPressure(x) has been removed. Please use @pressure = x instead.";
      };
      scope.getPressureColor = function() {
        throw "@getPressureColor() has been removed. Please Take and use Pressure() instead.";
      };
      scope.setText = function() {
        throw "@setText(x) has been removed. Please @text = x instead.";
      };
      Object.defineProperty(scope, "FlowArrows", {
        get: function() {
          throw "root.FlowArrows has been removed. Please access FlowArrows via Take.";
        }
      });
      Object.defineProperty(scope, "cx", {
        get: function() {
          throw "cx has been removed.";
        }
      });
      Object.defineProperty(scope, "cy", {
        get: function() {
          throw "cy has been removed.";
        }
      });
      Object.defineProperty(scope, "angle", {
        get: function() {
          throw "angle has been removed. Please use @rotation instead.";
        }
      });
      Object.defineProperty(scope, "turns", {
        get: function() {
          throw "turns has been removed. Please use @rotation instead.";
        }
      });
      return Object.defineProperty(scope, "transform", {
        get: function() {
          throw "@transform has been removed. You can just delete the \"transform.\" and things should work.";
        }
      });
    });
  });

  Take(["Registry"], function(Registry) {
    return Registry.add("ScopeProcessor", function(scope) {
      var base1, name1, ref;
      if (scope.parent != null) {
        if (((ref = scope.parent[scope.instanceName]) != null ? ref.element.id : void 0) === scope.element.id) {
          console.log(scope.parent);
          throw "Duplicate instance name detected in ^^^ " + scope.parent.instanceName + ": " + scope.instanceName;
        }
        if ((base1 = scope.parent)[name1 = scope.instanceName] == null) {
          base1[name1] = scope;
        }
        return scope.parent.children.push(scope);
      }
    });
  });

  Take(["Reaction", "Registry"], function(Reaction, Registry) {
    return Registry.add("ScopeProcessor", function(scope) {
      Reaction("Schematic:Hide", function() {
        return typeof scope.animateMode === "function" ? scope.animateMode() : void 0;
      });
      return Reaction("Schematic:Show", function() {
        return typeof scope.schematicMode === "function" ? scope.schematicMode() : void 0;
      });
    });
  });

  Take(["Registry"], function(Registry) {
    return Registry.add("ScopeProcessor", function(scope) {
      return Take("ScopeSetup", function() {
        return typeof scope.setup === "function" ? scope.setup() : void 0;
      });
    });
  });

  Take(["Registry", "ScopeCheck", "Tween1"], function(Registry, ScopeCheck, Tween1) {
    return Registry.add("ScopeProcessor", function(scope) {
      var tick;
      ScopeCheck(scope, "show", "hide");
      tick = function(v) {
        return scope.alpha = v;
      };
      scope.show = function(d) {
        if (d == null) {
          d = 1;
        }
        return Tween1(scope.alpha, 1, d, tick);
      };
      return scope.hide = function(d) {
        if (d == null) {
          d = 1;
        }
        return Tween1(scope.alpha, -1, d, tick);
      };
    });
  });

  Take(["Pressure", "Registry", "ScopeCheck", "SVG"], function(Pressure, Registry, ScopeCheck, SVG) {
    return Registry.add("ScopeProcessor", function(scope) {
      var alpha, applyVisibility, element, fillPath, isLine, parent, placeholder, pressure, ref, strokePath, text, textElement, visible;
      element = scope.element;
      parent = element.parentNode;
      placeholder = SVG.create("g");
      strokePath = fillPath = element.querySelector("path");
      isLine = ((ref = element.getAttribute("id")) != null ? ref.indexOf("Line") : void 0) > -1;
      textElement = element.querySelector("tspan" || element.querySelector("text"));
      ScopeCheck(scope, "pressure", "visible", "alpha", "stroke", "fill", "linearGradient", "radialGradient", "text", "style");
      applyVisibility = function() {
        if (visible && alpha > 0) {
          return parent.replaceChild(element, placeholder);
        } else {
          return parent.replaceChild(placeholder, element);
        }
      };
      scope.stype = function() {
        throw "@style is up for debate. Please show Ivan what you're using it to do.";
      };
      pressure = null;
      Object.defineProperty(scope, 'pressure', {
        get: function() {
          return pressure;
        },
        set: function(val) {
          if (pressure !== val) {
            pressure = val;
            if (isLine && !scope.root.BROKEN_LINES) {
              return scope.stroke(Pressure(scope.pressure));
            } else {
              return scope.fill(Pressure(scope.pressure));
            }
          }
        }
      });
      text = textElement != null ? textElement.textContent : void 0;
      Object.defineProperty(scope, 'text', {
        get: function() {
          return text;
        },
        set: function(val) {
          if (text !== val) {
            return SVG.attr("textContent", text = val);
          }
        }
      });
      visible = true;
      Object.defineProperty(scope, 'visible', {
        get: function() {
          return visible;
        },
        set: function(val) {
          if (visible !== val) {
            return applyVisibility(visible = val);
          }
        }
      });
      alpha = 1;
      Object.defineProperty(scope, 'alpha', {
        get: function() {
          return alpha;
        },
        set: function(val) {
          if (alpha !== val) {
            SVG.style(element, "opacity", alpha = val);
            return applyVisibility();
          }
        }
      });
      scope.stroke = function(color) {
        if (strokePath != null) {
          SVG.attr(strokePath, "stroke", null);
          strokePath = null;
        }
        return SVG.attr(element, "stroke", color);
      };
      scope.fill = function(color) {
        if (fillPath != null) {
          SVG.attr(fillPath, "fill", null);
          fillPath = null;
        }
        return SVG.attr(element, "fill", color);
      };
      scope.linearGradient = function(stops, x1, y1, x2, y2) {
        if (x1 == null) {
          x1 = 0;
        }
        if (y1 == null) {
          y1 = 0;
        }
        if (x2 == null) {
          x2 = 1;
        }
        if (y2 == null) {
          y2 = 0;
        }
      };
      return scope.radialGradient = function(stops, cx, cy, radius) {};
    });
  });

  Take(["RAF", "Registry", "ScopeCheck", "DOMContentLoaded"], function(RAF, Registry, ScopeCheck) {
    return Registry.add("ScopeProcessor", function(scope) {
      var applyTransform, denom, element, matrix, ref, rotation, scaleX, scaleY, t, transform, transformBaseVal, x, y;
      element = scope.element;
      transformBaseVal = (ref = element.transform) != null ? ref.baseVal : void 0;
      transform = document.rootElement.createSVGTransform();
      matrix = document.rootElement.createSVGMatrix();
      x = 0;
      y = 0;
      rotation = 0;
      scaleX = 1;
      scaleY = 1;
      ScopeCheck(scope, "x", "y", "rotation", "scale", "scaleX", "scaleY", "skewX", "skewY");
      if ((transformBaseVal != null ? transformBaseVal.numberOfItems : void 0) === 1) {
        t = transformBaseVal.getItem(0);
        switch (t.type) {
          case SVGTransform.SVG_TRANSFORM_MATRIX:
            x = t.matrix.e;
            y = t.matrix.f;
            rotation = 180 / Math.PI * Math.atan2(t.matrix.b, t.matrix.a);
            denom = Math.pow(t.matrix.a, 2) + Math.pow(t.matrix.c, 2);
            scaleX = Math.sqrt(denom);
            scaleY = (t.matrix.a * t.matrix.d - t.matrix.b * t.matrix.c) / scaleX;
            break;
          default:
            throw new Error("^ Transform encountered an SVG element with a non-matrix transform");
        }
      } else if ((transformBaseVal != null ? transformBaseVal.numberOfItems : void 0) > 1) {
        console.log(element);
        throw new Error("^ Transform encountered an SVG element with more than one transform");
      }
      applyTransform = function() {
        matrix.a = scaleX;
        matrix.d = scaleY;
        matrix.e = x;
        matrix.f = y;
        transform.setMatrix(matrix.rotate(rotation));
        return element.transform.baseVal.initialize(transform);
      };
      Object.defineProperty(scope, 'x', {
        get: function() {
          return x;
        },
        set: function(val) {
          if (x !== val) {
            x = val;
            return RAF(applyTransform, true, 1);
          }
        }
      });
      Object.defineProperty(scope, 'y', {
        get: function() {
          return y;
        },
        set: function(val) {
          if (y !== val) {
            y = val;
            return RAF(applyTransform, true, 1);
          }
        }
      });
      Object.defineProperty(scope, 'rotation', {
        get: function() {
          return rotation;
        },
        set: function(val) {
          if (rotation !== val) {
            rotation = val;
            return RAF(applyTransform, true, 1);
          }
        }
      });
      Object.defineProperty(scope, 'scale', {
        get: function() {
          return (scaleX + scaleY) / 2;
        },
        set: function(val) {
          if (scaleX !== val || scaleY !== val) {
            scaleX = scaleY = val;
            return RAF(applyTransform, true, 1);
          }
        }
      });
      Object.defineProperty(scope, 'scaleX', {
        get: function() {
          return scaleX;
        },
        set: function(val) {
          if (scaleX !== val) {
            scaleX = val;
            return RAF(applyTransform, true, 1);
          }
        }
      });
      return Object.defineProperty(scope, 'scaleY', {
        get: function() {
          return scaleY;
        },
        set: function(val) {
          if (scaleY !== val) {
            scaleY = val;
            return RAF(applyTransform, true, 1);
          }
        }
      });
    });
  });

  Take(["Registry", "Tick"], function(Registry, Tick) {
    return Registry.add("ScopeProcessor", function(scope) {
      var running, startTime, update;
      if (scope.update == null) {
        return;
      }
      running = false;
      startTime = null;
      update = scope.update;
      scope.update = function() {
        throw "@update() is called by the system. Please don't call it yourself.";
      };
      Tick(function(time, dt) {
        if (!running) {
          return;
        }
        return update.call(scope, dt, time - startTime);
      });
      scope.update.start = function() {
        if (startTime == null) {
          startTime = ((typeof performance !== "undefined" && performance !== null ? performance.now() : void 0) || 0) / 1000;
        }
        return running = true;
      };
      scope.update.stop = function() {
        return running = false;
      };
      scope.update.toggle = function() {
        if (running) {
          return scope.update.stop();
        } else {
          return scope.update.start();
        }
      };
      return scope.update.restart = function() {
        return startTime = null;
      };
    });
  });

  Take(["Symbol"], function(Symbol) {
    return Symbol("DefaultElement", [], function(element) {
      var scope;
      return scope = {};
    });
  });

  Take(["Pressure", "Reaction", "Symbol"], function(Pressure, Reaction, Symbol) {
    return Symbol("HydraulicField", [], function(svgElement) {
      var scope;
      return scope = {
        setup: function() {
          var isInsideOtherField, p;
          isInsideOtherField = false;
          p = scope.parent;
          while ((p != null) && !isInsideOtherField) {
            isInsideOtherField = p._symbol === scope._symbol;
            p = p.parent;
          }
          if (!isInsideOtherField) {
            return Reaction("Schematic:Show", function() {
              return scope.pressure = Pressure.white;
            });
          }
        }
      };
    });
  });

  Take(["Pressure", "Reaction", "SVG", "Symbol"], function(Pressure, Reaction, SVG, Symbol) {
    return Symbol("HydraulicLine", [], function(svgElement) {
      var scope, strip;
      strip = function(elm) {
        var child, len, m, ref, results;
        if (typeof elm.removeAttributeNS === "function") {
          elm.removeAttributeNS(null, "fill");
        }
        if (typeof elm.removeAttributeNS === "function") {
          elm.removeAttributeNS(null, "stroke");
        }
        if (elm.childNodes.length) {
          ref = elm.childNodes;
          results = [];
          for (m = 0, len = ref.length; m < len; m++) {
            child = ref[m];
            results.push(strip(child));
          }
          return results;
        }
      };
      strip(svgElement);
      svgElement.setAttributeNS(null, "fill", "transparent");
      return scope = {
        pilot: function(name) {
          var len, m, path, ref, results;
          if (scope[name] == null) {
            throw scope.name + ".pilot(\"" + name + "\") failed: " + name + " is not a child of " + scope.name;
          }
          ref = scope[name].element.querySelectorAll("path");
          results = [];
          for (m = 0, len = ref.length; m < len; m++) {
            path = ref[m];
            results.push(SVG.attrs(path, {
              "stroke-dasharray": "6 6"
            }));
          }
          return results;
        },
        setup: function() {
          return Reaction("Schematic:Show", function() {
            return scope.pressure = Pressure.black;
          });
        }
      };
    });
  });

  Take(["Reaction", "Symbol", "SVG"], function(Reaction, Symbol, SVG) {
    return Symbol("Labels", ["labelsContainer"], function(svgElement) {
      var c, len, m, ref, scope;
      ref = svgElement.querySelectorAll("[fill]");
      for (m = 0, len = ref.length; m < len; m++) {
        c = ref[m];
        c.removeAttributeNS(null, "fill");
      }
      return scope = {
        setup: function() {
          Reaction("Labels:Hide", function() {
            return scope.visible = false;
          });
          Reaction("Labels:Show", function() {
            return scope.visible = true;
          });
          return Reaction("Background:Set", function(v) {
            var l;
            l = (v / 2 + .8) % 1;
            return SVG.attr(svgElement, "fill", "hsl(220, 4%, " + (l * 100) + "%)");
          });
        }
      };
    });
  });

  Take(["SVG", "Symbol"], function(SVG, Symbol) {
    return Symbol("Mask", [], function(svgElement) {
      var scope;
      svgElement.parentNode.removeChild(svgElement);
      return scope = {};
    });
  });

  (function() {
    var cbs;
    cbs = [];
    Make("Reaction", function(name, cb) {
      return (cbs[name] != null ? cbs[name] : cbs[name] = []).push(cb);
    });
    return Make("Action", function() {
      var args, cb, len, m, name, ref, results;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (cbs[name] != null) {
        ref = cbs[name];
        results = [];
        for (m = 0, len = ref.length; m < len; m++) {
          cb = ref[m];
          results.push(cb.apply(null, args));
        }
        return results;
      }
    });
  })();

  (function() {
    var Component, definitions, instantiatedStarted;
    definitions = {};
    instantiatedStarted = false;
    return Make("Component", Component = {
      make: function() {
        var args, name, type;
        type = arguments[0], name = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        if (instantiatedStarted) {
          throw "The component \"" + name + "\" arrived after setup started. Please figure out a way to make it initialize faster.";
        }
        return (definitions[type] != null ? definitions[type] : definitions[type] = {})[name] = args.length === 1 ? args[0] : args;
      },
      take: function(type, name) {
        var ofType;
        instantiatedStarted = true;
        ofType = definitions[type] || {};
        if (name != null) {
          return ofType[name];
        } else {
          return ofType;
        }
      }
    });
  })();

  Make("Dev", window.top.location.hostname === "localhost");

  Take(["KeyNames"], function(KeyNames) {
    var KeyMe, actionize, downHandlers, getModifier, handleKey, keyDown, keyUp, runCallbacks, upHandlers;
    downHandlers = {};
    upHandlers = {};
    KeyMe = function(key, opts) {
      var name;
      if (key == null) {
        throw "You must provide a key name or code for KeyMe(key, options)";
      }
      if (typeof opts !== "object") {
        throw "You must provide an options object for KeyMe(key, options)";
      }
      name = typeof key === "string" ? key : KeyNames[key];
      return actionize(opts.down, opts.up, name, opts.modifier);
    };
    KeyMe.any = function(down, up) {
      return actionize(down, up, "any");
    };
    KeyMe.char = function(char, down, up) {
      return actionize(down, up, char);
    };
    KeyMe.shortcut = function(modifier, char, down, up) {
      return actionize(down, up, char, modifier);
    };
    KeyMe.pressing = {};
    KeyMe.lastPressed = null;
    actionize = function(down, up, name, modifier) {
      if (down != null) {
        (downHandlers[name] != null ? downHandlers[name] : downHandlers[name] = []).push({
          callback: down,
          modifier: modifier
        });
      }
      if (up != null) {
        return (upHandlers[name] != null ? upHandlers[name] : upHandlers[name] = []).push({
          callback: up,
          modifier: modifier
        });
      }
    };
    keyDown = function(e) {
      var code, name;
      code = e.which || e.keyCode;
      name = KeyNames[code];
      if (name == null) {
        return;
      }
      if (KeyMe.pressing[name]) {
        return;
      }
      KeyMe.pressing[name] = true;
      KeyMe.lastPressed = {
        name: name,
        code: code
      };
      return handleKey(name, e, downHandlers);
    };
    keyUp = function(e) {
      var code, name;
      code = e.keyCode;
      name = KeyNames[code];
      if (name == null) {
        return;
      }
      delete KeyMe.pressing[name];
      return handleKey(name, e, upHandlers);
    };
    handleKey = function(name, e, handlers) {
      var modifier;
      modifier = getModifier(e);
      if (name === modifier) {
        modifier = null;
      }
      runCallbacks(handlers.any, modifier);
      return runCallbacks(handlers[name], modifier);
    };
    getModifier = function(e) {
      if (e.ctrlKey) {
        return "meta";
      }
      if (e.altKey) {
        return "alt";
      }
      if (e.shiftKey) {
        return "shift";
      }
    };
    runCallbacks = function(callbacks, modifier) {
      var command, len, m, results;
      if (callbacks != null) {
        results = [];
        for (m = 0, len = callbacks.length; m < len; m++) {
          command = callbacks[m];
          if (command.modifier === modifier) {
            results.push(command.callback());
          }
        }
        return results;
      }
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", function() {
      return KeyMe.pressing = {};
    });
    return Make("KeyMe", KeyMe);
  });

  (function() {
    return Make("KeyNames", {
      3: "cancel",
      6: "help",
      8: "back_space",
      9: "tab",
      12: "clear",
      13: "return",
      14: "enter",
      16: "shift",
      17: "control",
      18: "alt",
      19: "pause",
      20: "caps_lock",
      27: "escape",
      32: "space",
      33: "page_up",
      34: "page_down",
      35: "end",
      36: "home",
      37: "left",
      38: "up",
      39: "right",
      40: "down",
      44: "printscreen",
      45: "insert",
      46: "delete",
      48: "0",
      49: "1",
      50: "2",
      51: "3",
      52: "4",
      53: "5",
      54: "6",
      55: "7",
      56: "8",
      57: "9",
      59: "semicolon",
      61: "equals",
      65: "a",
      66: "b",
      67: "c",
      68: "d",
      69: "e",
      70: "f",
      71: "g",
      72: "h",
      73: "i",
      74: "j",
      75: "k",
      76: "l",
      77: "m",
      78: "n",
      79: "o",
      80: "p",
      81: "q",
      82: "r",
      83: "s",
      84: "t",
      85: "u",
      86: "v",
      87: "w",
      88: "x",
      89: "y",
      90: "z",
      93: "context_menu",
      96: "numpad0",
      97: "numpad1",
      98: "numpad2",
      99: "numpad3",
      100: "numpad4",
      101: "numpad5",
      102: "numpad6",
      103: "numpad7",
      104: "numpad8",
      105: "numpad9",
      106: "multiply",
      107: "add",
      108: "separator",
      109: "subtract",
      110: "decimal",
      111: "divide",
      112: "f1",
      113: "f2",
      114: "f3",
      115: "f4",
      116: "f5",
      117: "f6",
      118: "f7",
      119: "f8",
      120: "f9",
      121: "f10",
      122: "f11",
      123: "f12",
      124: "f13",
      125: "f14",
      126: "f15",
      127: "f16",
      128: "f17",
      129: "f18",
      130: "f19",
      131: "f20",
      132: "f21",
      133: "f22",
      134: "f23",
      135: "f24",
      144: "num_lock",
      145: "scroll_lock",
      173: "minus",
      187: "equals",
      188: "comma",
      189: "minus",
      190: "period",
      191: "slash",
      192: "back_quote",
      219: "open_bracket",
      220: "back_slash",
      221: "close_bracket",
      222: "quote",
      224: "meta"
    });
  })();

  (function() {
    var callbacksByPriority, requested, run;
    requested = false;
    callbacksByPriority = [[], []];
    run = function(time) {
      var callbacks, cb, len, m, p, results;
      requested = false;
      results = [];
      for (p = m = 0, len = callbacksByPriority.length; m < len; p = ++m) {
        callbacks = callbacksByPriority[p];
        if (!(callbacks != null)) {
          continue;
        }
        callbacksByPriority[p] = [];
        results.push((function() {
          var len1, n, results1;
          results1 = [];
          for (n = 0, len1 = callbacks.length; n < len1; n++) {
            cb = callbacks[n];
            results1.push(cb(time));
          }
          return results1;
        })());
      }
      return results;
    };
    return Make("RAF", function(cb, ignoreDuplicates, p) {
      var c, len, m, ref;
      if (ignoreDuplicates == null) {
        ignoreDuplicates = false;
      }
      if (p == null) {
        p = 0;
      }
      if (cb == null) {
        throw "RAF(null)";
      }
      ref = callbacksByPriority[p];
      for (m = 0, len = ref.length; m < len; m++) {
        c = ref[m];
        if (!(c === cb)) {
          continue;
        }
        if (ignoreDuplicates) {
          return;
        }
        console.log(cb);
        throw "^ RAF was called more than once with this function. You can use RAF(fn, true) to drop duplicates and bypass this error.";
      }
      (callbacksByPriority[p] != null ? callbacksByPriority[p] : callbacksByPriority[p] = []).push(cb);
      if (!requested) {
        requested = true;
        requestAnimationFrame(run);
      }
      return cb;
    });
  })();

  (function() {
    var Registry, items, tooLate;
    items = {};
    tooLate = false;
    return Make("Registry", Registry = {
      add: function(type, item, name) {
        if (name != null) {
          if (tooLate) {
            console.log(item);
            throw "^ Registry.add was called after registration closed. Please make " + type + ": " + name + " init faster.";
          }
          return (items[type] != null ? items[type] : items[type] = {})[name] = item;
        } else {
          if (tooLate) {
            console.log(item);
            throw "^ Registry.add was called after registration closed. Please make this " + type + " init faster.";
          }
          return (items[type] != null ? items[type] : items[type] = []).push(item);
        }
      },
      all: function(type) {
        return items[type];
      },
      closeRegistration: function() {
        return tooLate = true;
      }
    });
  })();

  Take(["RAF"], function(RAF) {
    return Make("Resize", function(cb) {
      var r;
      (r = function() {
        return RAF(cb, true);
      })();
      return window.addEventListener("resize", r);
    });
  });

  Make("ScopeCheck", function() {
    var len, m, prop, props, results, scope;
    scope = arguments[0], props = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    results = [];
    for (m = 0, len = props.length; m < len; m++) {
      prop = props[m];
      if (!(scope[prop] != null)) {
        continue;
      }
      console.log(scope.element);
      throw "^ @" + prop + " is a reserved name. Please choose a different name for your child/property \"" + prop + "\".";
    }
    return results;
  });

  (function() {
    var SVG, SVGReady, SVGReadyForMutation, createStops, defs, props, root, svgNS, xlinkNS;
    root = document.rootElement;
    defs = root.querySelector("defs");
    svgNS = "http://www.w3.org/2000/svg";
    xlinkNS = "http://www.w3.org/1999/xlink";
    props = {
      textContent: true
    };
    SVGReady = false;
    SVG = {
      root: root,
      defs: defs,
      move: function(elm, x, y) {
        if (y == null) {
          y = 0;
        }
        throw "MOVE";
      },
      rotate: function(elm, r) {
        throw "ROTATE";
      },
      origin: function(elm, ox, oy) {
        throw "ORIGIN";
      },
      scale: function(elm, x, y) {
        if (y == null) {
          y = x;
        }
        throw "SCALE";
      },
      create: function(type, parent, attrs) {
        var elm;
        elm = document.createElementNS(svgNS, type);
        if (attrs != null) {
          SVG.attrs(elm, attrs);
        }
        if (parent != null) {
          SVG.append(parent, elm);
        }
        return elm;
      },
      clone: function(source, parent, attrs) {
        var attr, child, elm, len, len1, m, n, ref, ref1;
        if (source == null) {
          throw "Clone source is undefined in SVG.clone(source, parent, attrs)";
        }
        if (!SVGReadyForMutation()) {
          throw "SVG.clone() called before SVGReady";
        }
        elm = document.createElementNS(svgNS, "g");
        ref = source.attributes;
        for (m = 0, len = ref.length; m < len; m++) {
          attr = ref[m];
          SVG.attr(elm, attr.name, attr.value);
        }
        SVG.attrs(elm, {
          id: null
        });
        if (attrs != null) {
          SVG.attrs(elm, attrs);
        }
        ref1 = source.childNodes;
        for (n = 0, len1 = ref1.length; n < len1; n++) {
          child = ref1[n];
          SVG.append(elm, child.cloneNode(true));
        }
        if (parent != null) {
          SVG.append(parent, elm);
        }
        return elm;
      },
      append: function(parent, child) {
        if (!SVGReadyForMutation()) {
          throw "SVG.append() called before SVGReady";
        }
        parent.appendChild(child);
        return child;
      },
      prepend: function(parent, child) {
        if (!SVGReadyForMutation()) {
          throw "SVG.prepend() called before SVGReady";
        }
        if (parent.hasChildNodes()) {
          parent.insertBefore(child, parent.firstChild);
        } else {
          parent.appendChild(child);
        }
        return child;
      },
      attrs: function(elm, attrs) {
        var k, v;
        if (!elm) {
          throw "SVG.attrs was called with a null element";
        }
        if (typeof attrs !== "object") {
          console.log(attrs);
          throw "SVG.attrs requires an object as the second argument, got ^";
        }
        for (k in attrs) {
          v = attrs[k];
          SVG.attr(elm, k, v);
        }
        return elm;
      },
      attr: function(elm, k, v) {
        var base1, ns;
        if (!elm) {
          throw "SVG.attr was called with a null element";
        }
        if (typeof k !== "string") {
          console.log(k);
          throw "SVG.attr requires a string as the second argument, got ^";
        }
        if (v === void 0) {
          return (base1 = elm._SVG_attr)[k] != null ? base1[k] : base1[k] = elm.getAttribute(k);
        }
        if (elm._SVG_attr == null) {
          elm._SVG_attr = {};
        }
        if (elm._SVG_attr[k] !== v) {
          elm._SVG_attr[k] = v;
          if (props[k] != null) {
            elm[k] = v;
          } else if (v != null) {
            ns = k === "xlink:href" ? xlinkNS : null;
            elm.setAttributeNS(ns, k, v);
          } else {
            ns = k === "xlink:href" ? xlinkNS : null;
            elm.removeAttributeNS(ns, k);
          }
        }
        return v;
      },
      styles: function(elm, styles) {
        var k, v;
        if (!elm) {
          throw "SVG.styles was called with a null element";
        }
        if (typeof styles !== "object") {
          console.log(styles);
          throw "SVG.styles requires an object as the second argument, got ^";
        }
        for (k in styles) {
          v = styles[k];
          SVG.style(elm, k, v);
        }
        return elm;
      },
      style: function(elm, k, v) {
        var base1;
        if (!elm) {
          throw "SVG.style was called with a null element";
        }
        if (typeof k !== "string") {
          console.log(k);
          throw "SVG.style requires a string as the second argument, got ^";
        }
        if (elm._SVG_style == null) {
          elm._SVG_style = {};
        }
        if (v === void 0) {
          return (base1 = elm._SVG_style)[k] != null ? base1[k] : base1[k] = elm.style[k];
        }
        if (elm._SVG_style[k] !== v) {
          elm.style[k] = elm._SVG_style[k] = v;
        }
        return v;
      },
      grey: function(elm, l) {
        SVG.attr(elm, "fill", "hsl(0, 0%, " + (l * 100) + "%)");
        return elm;
      },
      hsl: function(elm, h, s, l) {
        SVG.attr(elm, "fill", "hsl(" + (h * 360) + ", " + (s * 100) + "%, " + (l * 100) + "%)");
        return elm;
      },
      createGradient: function() {
        var attrs, gradient, name, stops, vertical;
        name = arguments[0], vertical = arguments[1], stops = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        attrs = vertical ? {
          id: name,
          x2: 0,
          y2: 1
        } : {
          id: name
        };
        gradient = SVG.create("linearGradient", defs, attrs);
        createStops(gradient, stops);
        return gradient;
      },
      createRadialGradient: function() {
        var gradient, name, stops;
        name = arguments[0], stops = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        gradient = SVG.create("radialGradient", defs, {
          id: name
        });
        createStops(gradient, stops);
        return gradient;
      },
      createColorMatrixFilter: function(name, values) {
        var filter;
        filter = SVG.create("filter", defs, {
          id: name
        });
        SVG.create("feColorMatrix", filter, {
          "in": "SourceGraphic",
          type: "matrix",
          values: values
        });
        return filter;
      }
    };
    createStops = function(gradient, stops) {
      var attrs, i, len, m, stop;
      stops = stops[0] instanceof Array ? stops[0] : stops;
      for (i = m = 0, len = stops.length; m < len; i = ++m) {
        stop = stops[i];
        attrs = typeof stop === "string" ? {
          "stop-color": stop,
          offset: (100 * i / (stops.length - 1)) + "%"
        } : {
          "stop-color": stop.color,
          offset: (100 * stop.offset) + "%"
        };
        SVG.create("stop", gradient, attrs);
      }
      return null;
    };
    SVGReadyForMutation = function() {
      return SVGReady || (SVGReady = Take("SVGReady"));
    };
    return Make("SVG", SVG);
  })();

  (function() {
    var Symbol, byInstanceName, bySymbolName, tooLate;
    bySymbolName = {};
    byInstanceName = {};
    tooLate = false;
    Symbol = function(symbolName, instanceNames, symbolFn) {
      var instanceName, len, m, results, symbol;
      if (bySymbolName[symbolName] != null) {
        throw "The symbol \"" + symbolName + "\" is defined more than once. You'll need to change one of the definitions to use a more unique name.";
      }
      if (tooLate) {
        throw "The symbol \"" + symbolName + "\" arrived after setup started. Please figure out a way to make it initialize faster.";
      }
      symbol = {
        create: symbolFn,
        name: symbolName
      };
      bySymbolName[symbolName] = symbol;
      results = [];
      for (m = 0, len = instanceNames.length; m < len; m++) {
        instanceName = instanceNames[m];
        if (byInstanceName[instanceName] != null) {
          throw "The instance \"" + instanceName + "\" is defined more than once, by Symbol \"" + byInstanceName[instanceName].symbolName + "\" and Symbol \"" + symbolName + "\". You'll need to change one of these instances to use a more unique name. You might need to change your FLA. This is a shortcoming of SVGA — sorry!";
        }
        results.push(byInstanceName[instanceName] = symbol);
      }
      return results;
    };
    Symbol.forSymbolName = function(symbolName) {
      tooLate = true;
      return bySymbolName[symbolName];
    };
    Symbol.forInstanceName = function(instanceName) {
      if (instanceName == null) {
        return;
      }
      tooLate = true;
      return byInstanceName[instanceName];
    };
    return Make("Symbol", Symbol);
  })();

  Take("RAF", function(RAF) {
    var callbacks, tick, time;
    callbacks = [];
    time = ((typeof performance !== "undefined" && performance !== null ? performance.now() : void 0) || 0) / 1000;
    RAF(tick = function(t) {
      var cb, dt, len, m;
      dt = t / 1000 - time;
      time += dt;
      for (m = 0, len = callbacks.length; m < len; m++) {
        cb = callbacks[m];
        cb(time, dt);
      }
      return RAF(tick);
    });
    return Make("Tick", function(cb, ignoreDuplicates) {
      var c, len, m;
      if (ignoreDuplicates == null) {
        ignoreDuplicates = false;
      }
      for (m = 0, len = callbacks.length; m < len; m++) {
        c = callbacks[m];
        if (!(c === cb)) {
          continue;
        }
        if (ignoreDuplicates) {
          return;
        }
        console.log(cb);
        throw "^ Tick was called more than once with this function. You can use Tick(fn, true) to drop duplicates and bypass this error.";
      }
      callbacks.push(cb);
      return cb;
    });
  });

  Take(["RAF", "SVG"], function(RAF, SVG) {
    var TRS;
    TRS = function(elm, debugColor) {
      var v, wrapper;
      if (elm == null) {
        console.log(elm);
        throw "^ Null element passed to TRS(elm)";
      }
      wrapper = SVG.create("g", elm.parentNode, {
        "x-trs": ""
      });
      SVG.append(wrapper, elm);
      if (debugColor != null) {
        SVG.create("rect", wrapper, {
          "class": "Debug",
          x: -2,
          y: -2,
          width: 4,
          height: 4,
          fill: debugColor
        });
      }
      elm._trs = v = {
        x: 0,
        y: 0,
        r: 0,
        sx: 1,
        sy: 1,
        ox: 0,
        oy: 0,
        apply: function() {
          SVG.attr(wrapper, "transform", "translate(" + v.x + "," + v.y + ") rotate(" + (v.r * 360) + ") scale(" + v.sx + "," + v.sy + ")");
          return SVG.attr(elm, "transform", "translate(" + (-v.ox) + "," + (-v.oy) + ")");
        }
      };
      return elm;
    };
    TRS.abs = function(elm, attrs) {
      var delta;
      if ((elm != null ? elm._trs : void 0) == null) {
        console.log(elm);
        throw "^ Non-TRS element passed to TRS.abs(elm, attrs)";
      }
      if (attrs == null) {
        console.log(elm);
        throw "^ Null attrs passed to TRS.abs(elm, attrs)";
      }
      if (attrs.scale != null) {
        attrs.sx = attrs.sy = attrs.scale;
      }
      if (attrs.x != null) {
        elm._trs.x = attrs.x;
      }
      if (attrs.y != null) {
        elm._trs.y = attrs.y;
      }
      if (attrs.r != null) {
        elm._trs.r = attrs.r;
      }
      if (attrs.sx != null) {
        elm._trs.sx = attrs.sx;
      }
      if (attrs.sy != null) {
        elm._trs.sy = attrs.sy;
      }
      if (attrs.ox != null) {
        delta = attrs.ox - elm._trs.ox;
        elm._trs.ox = attrs.ox;
        elm._trs.x += delta;
      }
      if (attrs.oy != null) {
        delta = attrs.oy - elm._trs.oy;
        elm._trs.oy = attrs.oy;
        elm._trs.y += delta;
      }
      if (attrs.now) {
        elm._trs.apply();
      } else {
        RAF(elm._trs.apply, true, 1);
      }
      return elm;
    };
    TRS.rel = function(elm, attrs) {
      if ((elm != null ? elm._trs : void 0) == null) {
        console.log(elm);
        throw "^ Non-TRS element passed to TRS.abs(elm, attrs)";
      }
      if (attrs == null) {
        console.log(elm);
        throw "^ Null attrs passed to TRS.abs(elm, attrs)";
      }
      if (attrs.x != null) {
        elm._trs.x += attrs.x;
      }
      if (attrs.y != null) {
        elm._trs.y += attrs.y;
      }
      if (attrs.r != null) {
        elm._trs.r += attrs.r;
      }
      if (attrs.sx != null) {
        elm._trs.sx += attrs.sx;
      }
      if (attrs.sy != null) {
        elm._trs.sy += attrs.sy;
      }
      if (attrs.ox != null) {
        elm._trs.ox += attrs.ox;
        elm._trs.x += attrs.ox;
      }
      if (attrs.oy != null) {
        elm._trs.oy += attrs.oy;
        elm._trs.y += attrs.oy;
      }
      if (attrs.now) {
        elm._trs.apply();
      } else {
        RAF(elm._trs.apply, true, 1);
      }
      return elm;
    };
    TRS.move = function(elm, x, y) {
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (elm._trs == null) {
        console.log(elm);
        throw "^ Non-TRS element passed to TRS.move";
      }
      return TRS.abs(elm, {
        x: x,
        y: y
      });
    };
    TRS.rotate = function(elm, r) {
      if (r == null) {
        r = 0;
      }
      if (elm._trs == null) {
        console.log(elm);
        throw "^ Non-TRS element passed to TRS.rotate";
      }
      return TRS.abs(elm, {
        r: r
      });
    };
    TRS.scale = function(elm, sx, sy) {
      if (sx == null) {
        sx = 1;
      }
      if (sy == null) {
        sy = sx;
      }
      if (elm._trs == null) {
        console.log(elm);
        throw "^ Non-TRS element passed to TRS.scale";
      }
      return TRS.abs(elm, {
        sx: sx,
        sy: sy
      });
    };
    TRS.origin = function(elm, ox, oy) {
      if (ox == null) {
        ox = 0;
      }
      if (oy == null) {
        oy = 0;
      }
      if (elm._trs == null) {
        console.log(elm);
        throw "^ Non-TRS element passed to TRS.origin";
      }
      return TRS.abs(elm, {
        ox: ox,
        oy: oy
      });
    };
    return Make("TRS", TRS);
  });

  Take(["RAF"], function(RAF) {
    var Tween, cloneObj, cubic, diffObj, tweens, update, updateTween;
    tweens = [];
    Tween = function(tween) {
      if (tween.on == null) {
        tween.on = cloneObj(tween.from);
      }
      if (tween.from == null) {
        tween.from = cloneObj(tween.on);
      }
      tween.delta = diffObj(tween.to, tween.from);
      tweens.push(tween);
      RAF(update, true);
      return tween;
    };
    Tween.cancel = function(tween) {
      return tween != null ? tween.cancelled = true : void 0;
    };
    update = function(t) {
      var tween;
      tweens = ((function() {
        var len, m, results;
        results = [];
        for (m = 0, len = tweens.length; m < len; m++) {
          tween = tweens[m];
          results.push(updateTween(tween, t / 1000));
        }
        return results;
      })()).filter(function(t) {
        return t != null;
      });
      if (tweens.length > 0) {
        return RAF(update, true);
      }
    };
    updateTween = function(tween, time) {
      var k, pos, ref, v;
      if (tween.started == null) {
        tween.started = time;
      }
      pos = Math.min(1, (time - tween.started) / tween.time);
      ref = tween.delta;
      for (k in ref) {
        v = ref[k];
        tween.on[k] = v * cubic(pos) + tween.from[k];
      }
      if (typeof tween.tick === "function") {
        tween.tick(pos, tween);
      }
      if (pos < 1 && !tween.cancelled) {
        return tween;
      }
    };
    cloneObj = function(obj) {
      var k, out, v;
      out = {};
      for (k in obj) {
        v = obj[k];
        out[k] = obj[k];
      }
      return out;
    };
    diffObj = function(a, b) {
      var diff, k, v;
      diff = {};
      for (k in a) {
        v = a[k];
        diff[k] = a[k] - b[k];
      }
      return diff;
    };
    cubic = function(input, inputMin, inputMax, outputMin, outputMax, clip) {
      var inputDiff, outputDiff, p, power;
      if (inputMin == null) {
        inputMin = 0;
      }
      if (inputMax == null) {
        inputMax = 1;
      }
      if (outputMin == null) {
        outputMin = 0;
      }
      if (outputMax == null) {
        outputMax = 1;
      }
      if (clip == null) {
        clip = true;
      }
      if (inputMin === inputMax) {
        return outputMin;
      }
      if (clip) {
        input = Math.max(inputMin, Math.min(inputMax, input));
      }
      outputDiff = outputMax - outputMin;
      inputDiff = inputMax - inputMin;
      p = (input - inputMin) / (inputDiff / 2);
      power = 3;
      if (p < 1) {
        return outputMin + outputDiff / 2 * Math.pow(p, power);
      } else {
        return outputMin + outputDiff / 2 * (2 - Math.abs(Math.pow(p - 2, power)));
      }
    };
    return Make("Tween", Tween);
  });

  Take(["Tick"], function(Tick) {
    var Tween1, cubic, gc, tweens;
    tweens = [];
    Tween1 = function(from, to, time, opts, next) {
      var tween;
      if (typeof opts === "function") {
        tween = {
          tick: opts
        };
      } else {
        tween = opts;
      }
      tween.from = from;
      tween.to = to;
      tween.time = time;
      if (next != null) {
        tween.next = next;
      }
      if (tween.pos == null) {
        tween.pos = 0;
      }
      if (tween.ease == null) {
        tween.ease = "easeInOut";
      }
      tween.value = 0;
      tween.delta = to - from;
      tween.cancelled = false;
      gc(tween.tick, tween.next);
      tweens.push(tween);
      return tween;
    };
    Tick(function(t, dt) {
      var len, m, results, tween;
      results = [];
      for (m = 0, len = tweens.length; m < len; m++) {
        tween = tweens[m];
        if (!tween.cancelled) {
          if (tween.pos < 1) {
            tween.pos += dt / tween.time;
            tween.value = tween.from + tween.delta * cubic(Math.min(1, tween.pos));
            results.push(tween.tick(tween.value, tween));
          } else if (tween.next != null) {
            tweens.push(tween.next);
            results.push(tween.next = null);
          } else {
            results.push(void 0);
          }
        }
      }
      return results;
    });
    gc = function(tick, next) {
      return tweens = tweens.filter(function(tween) {
        if (tween.pos >= 1) {
          return false;
        }
        if (tween.cancelled) {
          return false;
        }
        if (tween.tick === tick) {
          return false;
        }
        if ((next != null) && tween === next) {
          return false;
        }
        return true;
      });
    };
    cubic = function(input, inputMin, inputMax, outputMin, outputMax, clip) {
      var inputDiff, outputDiff, p, power;
      if (inputMin == null) {
        inputMin = 0;
      }
      if (inputMax == null) {
        inputMax = 1;
      }
      if (outputMin == null) {
        outputMin = 0;
      }
      if (outputMax == null) {
        outputMax = 1;
      }
      if (clip == null) {
        clip = true;
      }
      if (inputMin === inputMax) {
        return outputMin;
      }
      if (clip) {
        input = Math.max(inputMin, Math.min(inputMax, input));
      }
      outputDiff = outputMax - outputMin;
      inputDiff = inputMax - inputMin;
      p = (input - inputMin) / (inputDiff / 2);
      power = 3;
      if (p < 1) {
        return outputMin + outputDiff / 2 * Math.pow(p, power);
      } else {
        return outputMin + outputDiff / 2 * (2 - Math.abs(Math.pow(p - 2, power)));
      }
    };
    Tween1.cancel = gc;
    return Make("Tween1", Tween1);
  });

  Take(["Component", "ControlPanelView"], function(Component, ControlPanelView) {
    var instancesByNameByType, instantiate;
    instancesByNameByType = {};
    Make("Control", function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (typeof args[0] === "string") {
        return Component.make.apply(Component, ["Control"].concat(slice.call(args)));
      } else {
        return instantiate.apply(null, args);
      }
    });
    return instantiate = function(props) {
      var base1, defn, elm, instancesByName, name, scope, type;
      type = props.type;
      name = props.name || props.type;
      defn = Component.take("Control", type);
      if (type == null) {
        console.log(props);
        throw "^ You must include a \"type\" property when creating a Control instance";
      }
      if (defn == null) {
        console.log(props);
        throw "^ Unknown Control type: \"" + type + "\". First, check for typos. If everything looks good, this Control may have failed to load on time, which would mean there's a bug in the Control component.";
      }
      instancesByName = instancesByNameByType[type] != null ? instancesByNameByType[type] : instancesByNameByType[type] = {};
      if (!instancesByName[name]) {
        elm = ControlPanelView.createElement(props);
        scope = defn(elm, props);
        scope.element = elm;
        ControlPanelView.setup(scope, props);
        instancesByName[name] = {
          scope: scope,
          props: props
        };
      }
      if (typeof (base1 = instancesByName[name].scope).attach === "function") {
        base1.attach(props);
      }
      return instancesByName[name].scope;
    };
  });

  Take(["GUI", "Reaction", "Resize", "SVG", "TopBar", "TRS", "Tween1", "SVGReady"], function(GUI, Reaction, Resize, SVG, TopBar, TRS, Tween1) {
    var ControlPanelView, bg, consumedCols, consumedRows, g, panelX, positionPanel, rows, tick;
    consumedCols = 0;
    consumedRows = 0;
    rows = [];
    panelX = 1;
    g = TRS(SVG.create("g", GUI.elm, {
      "class": "Controls",
      "font-size": 20,
      "text-anchor": "middle"
    }));
    bg = SVG.create("rect", g, {
      "class": "BG",
      width: GUI.ControlPanel.width + GUI.ControlPanel.borderRadius,
      y: -GUI.ControlPanel.borderRadius,
      rx: GUI.ControlPanel.borderRadius,
      ry: GUI.ControlPanel.borderRadius,
      fill: "hsl(230, 6%, 17%)"
    });
    positionPanel = function() {
      var x, y;
      x = window.innerWidth - GUI.ControlPanel.width * panelX;
      y = TopBar.height;
      return TRS.move(g, x, y);
    };
    tick = function(v) {
      panelX = v;
      return positionPanel();
    };
    Resize(function() {
      return positionPanel();
    });
    Reaction("ControlPanel:Show", function() {
      return Tween1(panelX, 1, 0.7, tick);
    });
    Reaction("ControlPanel:Hide", function() {
      return Tween1(panelX, -.2, 0.7, tick);
    });
    Reaction("Background:Set", function(v) {
      var l;
      l = (v + .4) % 1;
      return SVG.attr(bg, "fill", "hsl(230, 10%, " + (l * 100) + "%)");
    });
    Take("ScopeReady", function() {
      var consumedHeight, h, len, len1, m, n, padX, padY, panelWidth, row, scope, unit, w, widthUnit, x, y;
      padX = GUI.ControlPanel.padX;
      padY = GUI.ControlPanel.padY;
      unit = GUI.ControlPanel.unit;
      panelWidth = GUI.ControlPanel.width;
      widthUnit = (panelWidth - padX * 5) / 4;
      consumedHeight = 0;
      for (m = 0, len = rows.length; m < len; m++) {
        row = rows[m];
        for (n = 0, len1 = row.length; n < len1; n++) {
          scope = row[n];
          w = scope.w * widthUnit + padX * (scope.w - 1);
          h = scope.h * unit;
          x = scope.x * (widthUnit + padX) + padX;
          y = scope.y * unit + padY * (scope.y + 1);
          scope.resize(w, h);
          TRS.move(scope.element, x, y);
          consumedHeight = Math.max(consumedHeight, y + h);
        }
      }
      return SVG.attr(bg, "height", consumedHeight + padY + GUI.ControlPanel.borderRadius);
    });
    return Make("ControlPanelView", ControlPanelView = {
      createElement: function(props) {
        var parent;
        parent = props.parent || g;
        return TRS(SVG.create("g", parent, {
          "class": props.name + " " + props.type,
          ui: true
        }));
      },
      setup: function(scope, props) {
        var w;
        if (props.parent != null) {
          return scope.resize(256, 48);
        } else {
          w = scope.w;
          if (consumedCols + w > 4) {
            consumedCols = 0;
            consumedRows++;
          }
          scope.x = consumedCols;
          scope.y = consumedRows;
          (rows[consumedRows] != null ? rows[consumedRows] : rows[consumedRows] = []).push(scope);
          return consumedCols += w;
        }
      }
    });
  });

  Take(["Action", "Reaction", "SVG", "DOMContentLoaded"], function(Action, Reaction, SVG) {
    var len, m, o, ref, setBackground, target;
    target = null;
    ref = window.parent.document.querySelectorAll("object");
    for (m = 0, len = ref.length; m < len; m++) {
      o = ref[m];
      if (o.contentDocument = document) {
        target = o;
        break;
      }
    }
    setBackground = function(v) {
      var c;
      c = "hsl(220, 0%, " + (v * 100) + "%)";
      return SVG.style(target, "background-color", c);
    };
    Reaction("Background:Set", setBackground);
    return Take("ScopeReady", function() {
      return Action("Background:Set", .75);
    });
  });

}).call(this);
