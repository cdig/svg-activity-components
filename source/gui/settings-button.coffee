Take ["Action", "GUI", "Input", "Reaction", "Scope", "SVG", "ScopeReady"], (Action, GUI, Input, Reaction, Scope, SVG)->
  
  elm = SVG.create "g", GUI.elm, ui: true
  scope = Scope elm
  
  scope.x = GUI.ControlPanel.panelMargin
  scope.y = GUI.ControlPanel.panelMargin
  
  width = 56
  height = 20
  
  hit = SVG.create "rect", elm,
    x: -GUI.ControlPanel.panelMargin
    y: -GUI.ControlPanel.panelMargin
    width: width + GUI.ControlPanel.panelMargin*2
    height: height + GUI.ControlPanel.panelMargin*2
    fill: "transparent"
  
  bg = SVG.create "rect", elm,
    width: width
    height: height
    rx: 3
    fill: "hsl(220, 45%, 45%)"
    
  label = SVG.create "text", elm,
    textContent: "Settings"
    x: width/2
    y: height * 0.66
    fontSize: 13
    textAnchor: "middle"
    fill: "hsl(220, 10%, 92%)"
  
  Input elm, click: ()-> Action "Settings:Toggle"
