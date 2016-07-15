Take ["Config", "Resize", "SVG", "Tick", "TopBarReady"], (Config, Resize, SVG, Tick)->
  return unless Config "dev"
  
  avgLength = 10
  avgList = []
  total = 0
  text = SVG.create "text", SVG.root
  
  Resize ()->
    SVG.attrs text, x: 10, y: 68
  
  Tick (time, dt)->
    avgList.push 1/dt
    total += 1/dt
    total -= avgList.shift() if avgList.length > avgLength
    fps = Math.min 60, Math.ceil total/avgList.length
    SVG.attrs text, textContent: "FPS: " + fps