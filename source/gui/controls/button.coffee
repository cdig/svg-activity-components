Take ["GUI", "Input", "Registry", "SVG", "Tween"], ({ControlPanel:GUI}, Input, Registry, SVG, Tween)->
  Registry.set "Control", "button", (elm, props)->

    # An array to hold all the click functions that have been attached to this button
    handlers = []

    bgFill = props.bgColor or "hsl(220, 10%, 92%)"
    labelFill = props.fontColor or "hsl(227, 16%, 24%)"

    outerWidth = props.width or GUI.colInnerWidth
    strokeWidth = 2

    # Enable pointer cursor, other UI features
    SVG.attrs elm, ui: true

    # Button background element
    bg = SVG.create "rect", elm,
      x: strokeWidth/2
      y: strokeWidth/2
      width: outerWidth - strokeWidth
      height: GUI.unit - strokeWidth
      rx: GUI.borderRadius
      strokeWidth: strokeWidth
      fill: bgFill

    # Button text label
    label = SVG.create "text", elm,
      textContent: props.name
      x: outerWidth / 2
      y: props.valign or ((props.fontSize or 16) + GUI.unit/5)
      fontSize: props.fontSize or 16
      fontWeight: props.fontWeight or "normal"
      fontStyle: props.fontStyle or "normal"
      fill: labelFill

    # Setup the bg stroke color for tweening
    bgc = blueBG = r:34, g:46, b:89
    lightBG = r:133, g:163, b:224
    orangeBG = r:255, g:196, b:46
    tickBG = (_bgc)->
      bgc = _bgc
      SVG.attrs bg, stroke: "rgb(#{bgc.r|0},#{bgc.g|0},#{bgc.b|0})"
    tickBG blueBG


    # Input event handling
    toNormal   = (e, state)-> Tween bgc, blueBG,  .2, tick:tickBG
    toHover    = (e, state)-> Tween bgc, lightBG,  0, tick:tickBG if not state.touch
    toClicking = (e, state)-> Tween bgc, orangeBG, 0, tick:tickBG
    toClicked  = (e, state)-> Tween bgc, lightBG, .2, tick:tickBG
    input = Input elm,
      moveIn: toHover
      dragIn: (e, state)-> toClicking() if state.clicking
      down: toClicking
      up: toHover
      moveOut: toNormal
      dragOut: toNormal

    # Hack around bugginess in chrome
    click = ()->
      # if input.state.clicking # breaks control disabling/enabling...
      return unless scope.enabled # ...so we do this instead (see enabled.coffee)
      toClicked()
      handler() for handler in handlers
    elm.addEventListener "mouseup", click
    elm.addEventListener "touchend", click

    # Our scope just has the 3 mandatory control functions, nothing special.
    return scope =
      height: GUI.unit
      input: input

      attach: (props)->
        handlers.push props.click if props.click?

      _highlight: (enable)->
        if enable
          SVG.attrs bg, fill: "url(#LightHighlightGradient)"
          SVG.attrs label, fill: "black"
        else
          SVG.attrs bg, fill: bgFill
          SVG.attrs label, fill: labelFill
