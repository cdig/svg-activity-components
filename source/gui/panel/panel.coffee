Take ["Action", "DOOM", "Ease", "GUI", "Input", "Resize", "SVG", "SVGReady"], (Action, DOOM, Ease, GUI, Input, Resize, SVG)->

  hideCallback = null

  foreignObject = SVG.create "foreignObject", GUI.elm, id: "panel"
  outer = DOOM.create "div", foreignObject, id: "panel-outer"
  cover = DOOM.create "div", outer, id: "panel-cover"
  frame = DOOM.create "div", outer, id: "panel-frame"
  close = DOOM.create "svg", frame, id: "panel-close"
  inner = DOOM.create "div", frame

  g = SVG.create "g", close, ui: true, transform: "translate(16,16)"
  SVG.create "circle", g, r: 16, fill: "#F00"
  SVG.create "path", g,
    d: "M-6,-6 L6,6 M6,-6 L-6,6"
    stroke: "#FFF"
    strokeWidth: 3
    strokeLinecap: "round"

  Input cover, click: ()-> Action "Panel:Hide"
  Input close, click: ()-> Action "Panel:Hide"

  window.addEventListener "keydown", (e)->
    if e.keyCode is 27 # esc
      Action "Panel:Hide"

  Resize ()->
    SVG.attrs foreignObject,
      width: window.innerWidth
      height: window.innerHeight

  # Elements inside foreignObject don't inherit scaling, so to shrink the panel on narrow screens
  # we need to apply scaling using CSS transform to the HTML elements. Due to the CSS grid layout
  # pushing the panel off the right side, we introduce a negative offset to keep it centered.
  Resize (info)->
    panelWidth = frame.offsetWidth
    offset = Math.max 0, (panelWidth - window.innerWidth)/2
    scale = Ease.linear info.window.w, 0, panelWidth, 0, 1
    DOOM frame, transform: "translateX(-#{offset}px) scale(#{scale})"


  Panel = (id, html)->
    DOOM inner, id: id
    inner.innerHTML = html # Force the panel to be re-built from scratch, rather than using DOOM's caching, since code following this call will expect fresh DOM nodes to add event handlers to
    Action "Panel:Show"
    return inner

  Panel.show = ()->
    DOOM foreignObject, pointerEvents: "auto"
    DOOM outer, opacity: 1

  Panel.hide = ()->
    DOOM foreignObject, pointerEvents: null
    DOOM outer, opacity: 0
    hideCallback?()
    hideCallback = null

  Panel.alert = (msg, cb)->
    hideCallback = cb
    inner = Panel "Alert", """
      <h3>#{msg}</h3>
      <div><button>Okay</button></div>
    """
    inner.querySelector("button").addEventListener "click", ()->
      Action "Panel:Hide"

  Panel.hide()
  Make "Panel", Panel
