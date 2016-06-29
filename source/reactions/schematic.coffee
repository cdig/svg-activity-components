Take ["Action", "Dispatch", "Global", "Reaction", "root"],
(      Action ,  Dispatch ,  Global ,  Reaction ,  root)->
  
  Reaction "Schematic:Toggle", ()->
    Action if Global.animateMode then "Schematic:Show" else "Schematic:Hide"
  
  Reaction "Schematic:Hide", ()->
    Global.animateMode = true
    Dispatch root, "animateMode"
  
  Reaction "Schematic:Show", ()->
    Global.animateMode = false
    Dispatch root, "schematicMode"