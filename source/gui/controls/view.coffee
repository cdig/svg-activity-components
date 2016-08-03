Take ["ControlPanelLayout", "GUI", "Resize", "SVG", "TRS"], (ControlPanelLayout, GUI, Resize, SVG, TRS)->
  gui = GUI.ControlPanel
  
  
  g = TRS SVG.create "g", GUI.elm,
    xControls: ""
    fontSize: 20
    textAnchor: "middle"
  
  bg = SVG.create "rect", g,
    xBg: ""
    x: -gui.pad
    y: -gui.pad
    width: gui.width + gui.pad*2
    rx: gui.borderRadius+gui.pad*2
  
  
  Resize ()->
    x = (window.innerWidth/2 - gui.width/2) |0
    y = (window.innerHeight/2 - gui.width/2) |0
    TRS.move g, x, y
  
  
  Take "ScopeReady", ()->
    h = ControlPanelLayout.performLayout()
    SVG.attrs bg, height: h + gui.pad*2
  
  
  Make "ControlPanel", ControlPanelView =
    createElement: (parent = null)->
      elm = SVG.create "g", parent or g
  
  
  # Reaction "ControlPanel:Show", ()-> Tween panelX, 1, 0.7, tick
  # Reaction "ControlPanel:Hide", ()-> Tween panelX, -.2, 0.7, tick
  # Reaction "Background:Set", (v)->
  #   l = (v + .4) % 1
  #   SVG.attrs bg, fill: "hsl(230, 10%, #{l*100}%)"
