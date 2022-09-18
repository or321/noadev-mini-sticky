(function(){
    Game.SINGLE_CONTROL = true;

    Engine.Assets.root = "../Package/";

    Game.addAction("preloadchangecolor", function(){
        Engine.Renderer.clearColor(0 / 255, 0 / 255, 0 / 255);
        document.getElementById("gameDiv").style.backgroundColor = "black";
    });
    
    Game.addAction("postinit", function(){
        Game.SceneFade.setColor(0, 0, 0);
        Game.LevelSelection.unllev();
    });

})();