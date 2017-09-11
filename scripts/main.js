define(["dojo/_base/declare",
    "dojo/_base/lang",
    "esri/map",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/GraphicsLayer",
    "config/defaults",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/MenuSeparator",
    "dojo/_base/Color",
    "esri/graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "libs/plot/DrawEx",
    "libs/plot/EditEx",
    "libs/plot/drawer/PlotGraphicUtil"
], function (declare,
             lang,
             Map,
             ArcGISTiledMapServiceLayer,
             ArcGISDynamicMapServiceLayer,
             GraphicsLayer,
             defaults,
             Menu,
             MenuItem,
             MenuSeparator,
             Color,
             Graphic,
             SimpleMarkerSymbol,
             SimpleLineSymbol,
             SimpleFillSymbol,
             Draw,
             Edit,
             PlotGraphicUtil) {
    return declare(null, {
        map: null,
        plotDraw:null,
        config: {},
        toolbar:null,
        graphicsLayer:null,
        editToolbar:null,

        constructor: function () {
            this.resizeUi();
            this.bindDomEvents();
        },

        //调整ui尺寸
        resizeUi: function () {
            var mapH = $("body").height() - $("#mapDiv").position().top;
            $("#mapDiv, .esricd-panel").height(mapH);
        },
        //绑定dom事件
        bindDomEvents: function () {
            $("#menu").delegate("button[node-type]","click",$.proxy(function(e){
                var drawType = $(e.currentTarget).attr("node-type");
                this.drawPlot(drawType);
            },this));
            $("#esricdBar").delegate("button[node-type]","click",$.proxy(function(e){
                var nodeType = $(e.currentTarget).attr("node-type");
                switch(nodeType){
                    case "clearBtn":
                        this.drawClear();
                        break;
                    case "outputBtn":
                        this.outputGraphic();
                        break;
                    case "inputBtn":
                        $('input[id=inputfile]').click();
                        break;
                    default:
                }
            },this));
            $('input[id=inputfile]').change($.proxy(function(e) {
                //alert($(this).val());
                if (e.currentTarget.files.length) {
                    var file = e.currentTarget.files[0];
                    PlotGraphicUtil.getPlotLayerFromTxt(file,this.graphicsLayer);
                }
            },this));
        },

        startup: function () {
            this.config = defaults;
            this.createWebMap();

            this.graphicsLayer = new GraphicsLayer();
            this.map.addLayer(this.graphicsLayer);
            this.toolbar = new Draw(this.map);
            this.toolbar.on("draw-end", lang.hitch(this,this.addToMap));
            this.editToolbar = new Edit(this.map, null, this.toolbar);
            this.createGraphicsMenu();
        },

        createWebMap: function () {
            this.map = new Map("mapDiv",{
                center: [104.06,30.67],
                    zoom: 3
            });
            var titlelayer =  new ArcGISTiledMapServiceLayer(this.config.titlelayer);
            this.editLayer = new GraphicsLayer({id:"editFeatureLayer"});
            this.tempLayer = new GraphicsLayer({id:"tempLayer"});
            this.resultLayer = new GraphicsLayer({id:"resultLayer"});

            this.map.addLayers([titlelayer,this.editLayer, this.tempLayer,this.resultLayer]);
        },

        //右键菜单
        createGraphicsMenu: function () {
            var selectedGraphic,ctxMenuForGraphics = new Menu({});
            ctxMenuForGraphics.addChild(new MenuItem({
                label: "编辑控制点",
                onClick: lang.hitch(this,function () {
                    this.editToolbar.activate(Edit.MOVE | Edit.ROTATE | Edit.SCALE, selectedGraphic);
                })
            }));
            ctxMenuForGraphics.addChild(new MenuItem({
                label: "停止编辑",
                onClick: lang.hitch(this,function () {
                    this.editToolbar.deactivate();
                })
            }));
            ctxMenuForGraphics.addChild(new MenuSeparator());
            ctxMenuForGraphics.addChild(new MenuItem({
                label: "删除",
                onClick: lang.hitch(this,function () {
                    this.graphicsLayer.remove(selectedGraphic);
                    this.editToolbar.deactivate();
                })
            }));
            ctxMenuForGraphics.startup();
            this.graphicsLayer.on("mouse-over", function (evt) {
                selectedGraphic = evt.graphic;
                ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
            });
            this.graphicsLayer.on("mouse-out", function (evt) {
                ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
            });
        },
        //触发标绘工具绘制的方法
        drawPlot: function (type) {
            var tool = type.toUpperCase().replace(/ /g, "_");
            this.toolbar.activate(Draw[tool]);
        },
        addToMap: function (evt) {
            var symbol;
            this.toolbar.deactivate();
            switch (evt.geometry.type) {
                case "point":
                case "multipoint":
                    symbol = new SimpleMarkerSymbol();
                    break;
                case "polyline":
                    symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 116, 217]), 15);
                    break;
                default:
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0, 1]),1.5),
                        new Color([255, 0, 0, 0.3]));
                    break;
            }
            var graphic = new Graphic(evt.geometry, symbol);
            this.graphicsLayer.add(graphic);
        },
        //清除标绘
        drawClear: function () {
            this.graphicsLayer.clear();
        },
        //导出标绘
        outputGraphic: function () {
            /*var jsonStr= PlotGraphicUtil.outPutPlotGraphicLayer2Txt(this.graphicsLayer);//图层整体输出
            alert(jsonStr);*/
            PlotGraphicUtil.outPutPlotGraphicLayer2Txt(this.graphicsLayer);
        }
    });
});

//低版本浏览器提示
(function () {
    var ie678 = '\v' == 'v';
    if (ie678) {
        alert("系统不支持ie8及以下版本浏览器访问！\n 请使用ie9+或chrome、safari等浏览器。");
    }
})();