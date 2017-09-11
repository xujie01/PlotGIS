define(["dojo/_base/declare","dojo/_base/lang","dojo/_base/array","dojo/_base/connect","dojo/_base/Color",
    "dojo/_base/window","dojo/has","dojo/keys","dojo/dom-construct","dojo/dom-style","esri/kernel",
    "esri/toolbars/draw","esri/symbols/SimpleMarkerSymbol","esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol","esri/graphic","esri/geometry/jsonUtils","esri/geometry/webMercatorUtils",
    "esri/geometry/Point","esri/geometry/Polyline","esri/geometry/Polygon","esri/geometry/Multipoint",
    "esri/geometry/Rect","./drawer/PlotDrawer","dojo/i18n!esri/nls/jsapi"],
    function(declare, lang, array, connect, Color, window, has, keys, domConstruct, domStyle, esriNS, Draw,
             SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Graphic, esriGeoJsonUtils, webMercatorUtils, Point, 
             Polyline, Polygon, Multipoint, Rect, PlotDrawer, esriBundle) {
    var clazz = declare(Draw, {
        declaredClass: "esri.toolbars.DrawEx",
        map:null,
        markerSymbol:null,
        lineSymbol:null,
        fillSymbol:null,
        drawPoints:null,
        drawOptions:null,
        noTouchPointer:null,
        respectDrawingVertexOrder: false,
        geometryType: null,
        tailFactor: 0.05,
        headPercentage: 0.07,
        dblClickZoom:true,
        tooltipDiv:null,
        drawGraphic:null,
        tempGraphic:null,
        curvePt1:null,
        curvePt2:null,
        dragged:false,
        screenPoint:null,

        constructor: function(map, options) {
            this.map = map;
            this.markerSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SOLID,10,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([255, 0, 0]),2),
                new Color([0, 0, 0, 0.25]));
            this.lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([255, 0, 0]),2);
            this.fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([255, 0, 0]),2),
                new Color([0, 0, 0, 0.25]));
            this.drawPoints = [];
            var defaultOptions = {
                showTooltips: true,
                drawTime: 75,
                tolerance: 8,
                tooltipOffset: 15
            };
            this.drawOptions = lang.mixin(lang.mixin({}, defaultOptions), options || {});
            this.noTouchPointer = !has("esri-touch") && !has("esri-pointer");
            //this.noTouchPointer || (this.drawOptions.showTooltips = false);
        },
        
        setRespectDrawingVertexOrder: function(respectDrawingVertexOrder) {
            this.respectDrawingVertexOrder = respectDrawingVertexOrder
        },
        setMarkerSymbol: function(markerSymbol) {
            this.markerSymbol = markerSymbol
        },
        setLineSymbol: function(lineSymbol) {
            this.lineSymbol = lineSymbol
        },
        setFillSymbol: function(fillSymbol) {
            this.fillSymbol = fillSymbol
        },

        activate: function(geometryType, options) {
            this.geometryType && this.deactivate();
            this.drawOptions = lang.mixin(lang.mixin({}, this.drawOptions), options || {});
            this.map.navigationManager.setImmediateClick(false);
            switch (geometryType) {
                case clazz.ARROW:
                case clazz.LEFT_ARROW:
                case clazz.RIGHT_ARROW:
                case clazz.UP_ARROW:
                case clazz.DOWN_ARROW:
                case clazz.TRIANGLE:
                case clazz.CIRCLE:
                case clazz.ELLIPSE:
                case clazz.RECTANGLE:
                case clazz.RECT_FLAG:
                case clazz.TRIANGLE_FLAG:
                case clazz.ASSEMBLY_AREA:
                    this.map.disablePan();
                    this.onClickConnect = connect.connect(this.map, "onClick", lang.hitch(this,this.onClickHandler));
                    this.onMouseDownConnect = connect.connect(this.map, 
                        !this.noTouchPointer ? "onSwipeStart" : "onMouseDown", lang.hitch(this,this.onMouseDownHandler));
                    this.onMouseDragConnect = connect.connect(this.map, 
                        !this.noTouchPointer ? "onSwipeMove" : "onMouseDrag", lang.hitch(this,this.onMouseDragHandler));
                    this.onMouseUpConnect = connect.connect(this.map, 
                        !this.noTouchPointer ? "onSwipeEnd" : "onMouseUp", lang.hitch(this,this.onMouseUpHandler));
                    has("esri-touch") && !has("esri-pointer") && 
                    (this.onMouseDownConnect = connect.connect(this.map, "onMouseDown", lang.hitch(this,this.onMouseDownHandler)),
                        this.onMouseDragConnect2 = connect.connect(this.map, "onMouseDrag", lang.hitch(this,this.onMouseDragHandler)),
                        this.onMouseUpConnect2 = connect.connect(this.map, "onMouseUp", lang.hitch(this,this.onMouseUpHandler)));
                    break;
                case clazz.POINT:
                case clazz.POINT_TEXT:
                    this.onClickConnect = connect.connect(this.map, "onClick", lang.hitch(this,this.onClickHandler));
                    break;
                case clazz.LINE:
                case clazz.EXTENT:
                case clazz.FREEHAND_POLYLINE:
                case clazz.FREEHAND_POLYGON:
                    this.map.disablePan();
                    this.onMouseDownConnect = connect.connect(this.map, 
                        !this.noTouchPointer ? "onSwipeStart" : "onMouseDown", lang.hitch(this,this.onMouseDownHandler));
                    this.onMouseDragConnect = connect.connect(this.map, 
                        !this.noTouchPointer ? "onSwipeMove" : "onMouseDrag", lang.hitch(this,this.onMouseDragHandler));
                    this.onMouseUpConnect = connect.connect(this.map, 
                        !this.noTouchPointer ? "onSwipeEnd" : "onMouseUp", lang.hitch(this,this.onMouseUpHandler));
                    has("esri-touch") && !has("esri-pointer") && 
                    (this.onMouseDownConnect = connect.connect(this.map, "onMouseDown", lang.hitch(this,this.onMouseDownHandler)),
                        this.onMouseDragConnect2 = connect.connect(this.map, "onMouseDrag", lang.hitch(this,this.onMouseDragHandler)),
                        this.onMouseUpConnect2 = connect.connect(this.map, "onMouseUp", lang.hitch(this,this.onMouseUpHandler)));
                    break;
                case clazz.POLYLINE:
                case clazz.POLYGON:
                case clazz.MULTI_POINT:
                case clazz.POLYLINEEX:
                    this.map.navigationManager.setImmediateClick(true);//点击是否立即响应，如双击则响应单击及双击事件
                    this.onClickConnect = connect.connect(this.map, "onClick", lang.hitch(this,this.onClickHandler));
                    this.onDblClickConnect = connect.connect(this.map, "onDblClick", lang.hitch(this,this.onDblClickHandler));
                    this.map.disablePan();
                    this.dblClickZoom = this.map.isDoubleClickZoom;
                    this.map.disableDoubleClickZoom();
                    break;
                case clazz.CURVE:
                case clazz.BEZIER_CURVE:
                case clazz.BEZIER_POLYGON:
                case clazz.FREEHAND_ARROW:
                case clazz.DOUBLE_ARROW:
                case clazz.MULTI_ARROW:
                case clazz.SIMPLE_ARROW:
                case clazz.TAILED_ARROW:
                case clazz.STRAIGHT_ARROW:
                case clazz.CUSTOM_ARROW:
                case clazz.CUSTOM_TAILED_ARROW:
                case clazz.HALF_CIRCLE:
                    this.map.navigationManager.setImmediateClick(true);
                    this.map.disablePan();
                    this.onClickConnect = connect.connect(this.map, "onClick", lang.hitch(this,this.onClickHandler));
                    this.onDblClickConnect = connect.connect(this.map, "onDblClick", lang.hitch(this,this.onDblClickHandler));
                    this.dblClickZoom = this.map.isDoubleClickZoom;
                    this.map.disableDoubleClickZoom();
                    break;
                default:
                    console.error("Unsupported geometry type: " + geometryType);
                    return
            }
            this.onKeyDownConnect = connect.connect(this.map, "onKeyDown", lang.hitch(this,this.onKeyDownHandler));
            this.reDrawConnect = connect.connect(this.map, "onExtentChange", lang.hitch(this,this.reDrawGraphic));

            this.geometryType = geometryType;
            this.toggleTooltip(true);
        },
        deactivate: function() {
            this.clear();
            connect.disconnect(this.onMouseMoveConnect);
            connect.disconnect(this.onMouseDownConnect);
            connect.disconnect(this.onMouseDragConnect);
            connect.disconnect(this.onMouseUpConnect);
            connect.disconnect(this.onMouseDownConnect);
            connect.disconnect(this.onMouseDragConnect2);
            connect.disconnect(this.onMouseUpConnect2);
            connect.disconnect(this.onClickConnect);
            connect.disconnect(this.onDblClickConnect);
            connect.disconnect(this.onKeyDownConnect);
            connect.disconnect(this.reDrawConnect);
            this.onMouseDownConnect = this.onMouseMoveConnect = this.onMouseDragConnect = this.onMouseUpConnect =
                this.onMouseDownConnect = this.onMouseDragConnect2 = this.onMouseUpConnect2 = this.onClickConnect =
                    this.onDblClickConnect = this.onKeyDownConnect = this.reDrawConnect = null;
            switch (this.geometryType) {
                case clazz.CIRCLE:
                case clazz.ELLIPSE:
                case clazz.TRIANGLE:
                case clazz.ARROW:
                case clazz.LEFT_ARROW:
                case clazz.RIGHT_ARROW:
                case clazz.UP_ARROW:
                case clazz.DOWN_ARROW:
                case clazz.RECTANGLE:
                case clazz.LINE:
                case clazz.EXTENT:
                case clazz.FREEHAND_POLYLINE:
                case clazz.FREEHAND_POLYGON:
                case clazz.RECT_FLAG:
                case clazz.ASSEMBLY_AREA:
                    this.map.enablePan();
                    break;
                case clazz.POLYLINE:
                case clazz.POLYLINEEX:
                case clazz.POLYGON:
                case clazz.MULTI_POINT:
                    this.map.enablePan();
                    this.dblClickZoom && this.map.enableDoubleClickZoom();
                    break;
                case clazz.CURVE:
                case clazz.BEZIER_CURVE:
                case clazz.BEZIER_POLYGON:
                case clazz.FREEHAND_ARROW:
                case clazz.DOUBLE_ARROW:
                case clazz.MULTI_ARROW:
                case clazz.SIMPLE_ARROW:
                case clazz.TAILED_ARROW:
                case clazz.STRAIGHT_ARROW:
                case clazz.CUSTOM_ARROW:
                case clazz.CUSTOM_TAILED_ARROW:
                case clazz.HALF_CIRCLE:
                    this.map.enablePan();
                    this.dblClickZoom && this.map.enableDoubleClickZoom();
                    break
            }
            this.geometryType = null;
            this.map.navigationManager.setImmediateClick(false);
            this.toggleTooltip(false);
        },
        clear: function() {
            this.drawGraphic && this.map.graphics.remove(this.drawGraphic, true);
            this.tempGraphic && this.map.graphics.remove(this.tempGraphic, true);
            this.drawGraphic = this.tempGraphic = null;
            this.drawPoints = [];
            this.curvePt1 = this.curvePt2 = null;
        },

        //标绘提示-------------------------------------------------------------------------------------------------------
        toggleTooltip: function(type) {
            this.drawOptions.showTooltips &&
            (type ? this.tooltipDiv ||
                (this.tooltipDiv = domConstruct.create("div", {"class": "toolTip"}, this.map.container),
                    this.tooltipDiv.style.display = "none",
                    this.tooltipDiv.style.position = "fixed",
                    this.setTooltipMessage(0),
                    this.onTooltipMouseEnterConnect = connect.connect(this.map, "onMouseOver", lang.hitch(this,this.updateTooltip)),
                    this.onTooltipMouseLeaveConnect = connect.connect(this.map, "onMouseOut", lang.hitch(this,this.hideTooltip)),
                    this.onTooltipMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.updateTooltip)))
                : this.tooltipDiv && (connect.disconnect(this.onTooltipMouseEnterConnect),
                connect.disconnect(this.onTooltipMouseLeaveConnect),
                connect.disconnect(this.onTooltipMouseMoveConnect),
                domConstruct.destroy(this.tooltipDiv),
                this.tooltipDiv = null))
        },
        setTooltipMessage: function(pntsLen) {
            if (this.tooltipDiv) {
                var drawerTip = "";
                switch (this.geometryType) {
                    case clazz.POINT:
                    case clazz.POINT_TEXT:
                        drawerTip = esriBundle.toolbars.draw.addPoint;
                        break;
                    case clazz.ARROW:
                    case clazz.LEFT_ARROW:
                    case clazz.RIGHT_ARROW:
                    case clazz.UP_ARROW:
                    case clazz.DOWN_ARROW:
                    case clazz.TRIANGLE:
                    case clazz.RECTANGLE:
                    case clazz.CIRCLE:
                    case clazz.ELLIPSE:
                    case clazz.RECT_FLAG:
                    case clazz.TRIANGLE_FLAG:
                    case clazz.ASSEMBLY_AREA:
                        drawerTip = esriBundle.toolbars.draw.addShape;
                        break;
                    case clazz.LINE:
                    case clazz.EXTENT:
                    case clazz.FREEHAND_POLYLINE:
                    case clazz.FREEHAND_POLYGON:
                        drawerTip = esriBundle.toolbars.draw.freehand;
                        break;
                    case clazz.POLYLINE:
                    case clazz.POLYGON:
                        drawerTip = esriBundle.toolbars.draw.start;
                        if (pntsLen === 1) {
                            drawerTip = esriBundle.toolbars.draw.resume
                        } else {
                            if (pntsLen >= 2) {
                                drawerTip = esriBundle.toolbars.draw.complete
                            }
                        }
                        break;
                    case clazz.MULTI_POINT:
                        drawerTip = esriBundle.toolbars.draw.addMultipoint;
                        if (pntsLen >= 1) {
                            drawerTip = esriBundle.toolbars.draw.finish
                        }
                        break;
                    case clazz.CURVE:
                        drawerTip = "单击开始绘制";
                        if (pntsLen === 1) {
                            drawerTip = "单击继续添加锚点"
                        } else {
                            if (pntsLen > 1) {
                                drawerTip = "双击结束绘制"
                            }
                        }
                        break;
                    case clazz.BEZIER_CURVE:
                        drawerTip = "单击开始绘制";
                        if (pntsLen > 1) {
                            drawerTip = "单击继续添加锚点，双击结束绘制"
                        }
                        break;
                    case clazz.BEZIER_POLYGON:
                    case clazz.FREEHAND_ARROW:
                        drawerTip = "单击开始绘制";
                        if (pntsLen > 1) {
                            drawerTip = "单击继续添加锚点，双击结束绘制"
                        }
                        break;
                    case clazz.DOUBLE_ARROW:
                        drawerTip = "单击开始绘制";
                        if (pntsLen == 1) {
                            drawerTip = "继续添加锚点"
                        }
                        if (pntsLen == 2 || pntsLen == 3) {
                            drawerTip = "单击继续添加锚点，双击结束绘制"
                        }
                        if (pntsLen == 4) {
                            drawerTip = "单击结束绘制"
                        }
                        break;
                    case clazz.MULTI_ARROW:
                        drawerTip = "单击开始绘制";
                        if (pntsLen == 1) {
                            drawerTip = "继续添加锚点"
                        }
                        if (pntsLen % 3 == 2 || pntsLen % 3 == 0) {
                            drawerTip = "单击继续添加锚点，双击结束绘制"
                        }
                        if (pntsLen % 3 == 1) {
                            drawerTip = "单击结束绘制"
                        }
                        break;
                    case clazz.HALF_CIRCLE:
                        drawerTip = "单击结束绘制";
                        break;
                    case clazz.CUSTOM_ARROW:
                    case clazz.CUSTOM_TAILED_ARROW:
                        drawerTip = "单击开始绘制";
                        if (pntsLen == 1) {
                            drawerTip = "继续添加锚点"
                        }
                        if (pntsLen >= 2) {
                            drawerTip = "单击继续添加锚点，双击结束绘制"
                        }
                        break;
                    case clazz.SIMPLE_ARROW:
                    case clazz.TAILED_ARROW:
                    case clazz.STRAIGHT_ARROW:
                        drawerTip = "单击开始绘制";
                        if (pntsLen > 1) {
                            drawerTip = "单击继续添加锚点，双击结束绘制"
                        }
                        break
                }
                this.tooltipDiv.innerHTML = drawerTip;
            }
        },
        updateTooltip: function(evt) {
            if (this.tooltipDiv) {
                var e;
                evt.clientX || evt.pageY ? (e = evt.clientX,
                    evt = evt.clientY) : (e = evt.clientX + window.body().scrollLeft - window.body().clientLeft,
                    evt = evt.clientY + window.body().scrollTop - window.body().clientTop);
                this.tooltipDiv.style.display = "none";
                domStyle.set(this.tooltipDiv, {
                    left: e + this.drawOptions.tooltipOffset + "px",
                    top: evt + "px"
                });
                this.tooltipDiv.style.display = ""
            }
        },
        hideTooltip: function() {
            this.tooltipDiv && (this.tooltipDiv.style.display = "none")
        },
        //--------------------------------------------------------------------------------------------------------------

        //监听事件-------------------------------------------------------------------------------------------------------
        onMouseDownHandler: function(evt) {
            this.dragged = false;
            var geometry;
            this.drawPoints.push(evt.mapPoint.offset(0, 0));
            switch (this.geometryType) {
                case clazz.LINE:
                    geometry = new Polyline({
                        paths: [[[evt.mapPoint.x, evt.mapPoint.y], [evt.mapPoint.x, evt.mapPoint.y]]],
                        spatialReference: this.map.spatialReference});
                    this.drawGraphic = this.map.graphics.add(new Graphic(geometry,this.lineSymbol), true);
                    break;
                case clazz.FREEHAND_POLYLINE:
                    this.screenPoint = evt.screenPoint;
                    geometry = new Polyline(this.map.spatialReference);
                    geometry.addPath(this.drawPoints);
                    this.drawGraphic = this.map.graphics.add(new Graphic(geometry,this.lineSymbol), true);
                    break;
                case clazz.CIRCLE:
                case clazz.ELLIPSE:
                case clazz.TRIANGLE:
                case clazz.ARROW:
                case clazz.LEFT_ARROW:
                case clazz.RIGHT_ARROW:
                case clazz.UP_ARROW:
                case clazz.DOWN_ARROW:
                case clazz.RECTANGLE:
                case clazz.FREEHAND_POLYGON:
                case clazz.RECT_FLAG:
                case clazz.TRIANGLE_FLAG:
                case clazz.ASSEMBLY_AREA:
                    this.screenPoint = evt.screenPoint;
                    geometry = new Polygon(this.map.spatialReference);
                    geometry.addRing(this.drawPoints);
                    this.drawGraphic = this.map.graphics.add(new Graphic(geometry,this.fillSymbol), true);
            }
            has("esri-touch") && evt.preventDefault()
        },
        onMouseMoveHandler: function(evt) {
            var mapPoint = evt.mapPoint;
            var endPoint = this.drawPoints[this.drawPoints.length - 1];
            var geometry = this.tempGraphic.geometry;
            var pntsLen,pntsDist,pnt1,pnt2,pnt3,pnt4,drawPolygon,pnts,pnts1,pnts2,vAngle;
            switch (this.geometryType) {
                case clazz.POLYLINE:
                case clazz.POLYGON:
                    geometry.setPoint(0, 0, {
                        x: endPoint.x,
                        y: endPoint.y
                    });
                    geometry.setPoint(0, 1, {
                        x: mapPoint.x,
                        y: mapPoint.y
                    });
                    this.tempGraphic.setGeometry(geometry);
                    break;
                case clazz.CURVE:
                    if (this.curvePt1 && this.curvePt2) {
                        var circle = this.circleDrawEx(this.map.toScreen(this.curvePt1), this.map.toScreen(this.curvePt2), 
                            this.map.toScreen(mapPoint));
                        if (circle.radius > 0) {
                            this.tempGraphic.geometry = this.CreateCircleSegmentFromThreePoints(circle, this.map.toScreen(this.curvePt1), 
                                this.map.toScreen(this.curvePt2), this.map.toScreen(mapPoint), 60, this.map);
                            this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                        }
                    } else {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    }
                    break;
                case clazz.BEZIER_CURVE:
                    if (this.drawPoints.length <= 1) {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    } else {
                        var drawPoints = [];
                        array.forEach(this.drawPoints, function(point) {
                            drawPoints.push({
                                x: point.x,
                                y: point.y
                            })
                        });
                        drawPoints.push({
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.geometry = this.CreateBezierPath(drawPoints, 100, this.map);
                        this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                    }
                    break;
                case clazz.BEZIER_POLYGON:
                    if (this.drawPoints.length <= 1) {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    } else {
                        drawPoints = [];
                        array.forEach(this.drawPoints, function(point) {
                            drawPoints.push({
                                x: point.x,
                                y: point.y
                            })
                        });
                        drawPoints.push({
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.geometry = this.CreateBezierPathPoly(drawPoints, 130, this.map);
                        this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                    }
                    break;
                case clazz.FREEHAND_ARROW:
                    if (this.drawPoints.length <= 1) {
                        pntsLen = this._2PtLen(this.drawPoints[0], mapPoint);
                        pntsDist = Math.atan((this.drawPoints[0].y - mapPoint.y) / (this.drawPoints[0].x - mapPoint.x));
                        switch (this.twoPtsRelationShip(this.drawPoints[0], mapPoint)) {
                            case "ne":
                                pntsDist += Math.PI / 2;
                                break;
                            case "nw":
                                pntsDist += Math.PI * 3 / 2;
                                break;
                            case "sw":
                                pntsDist += Math.PI * 3 / 2;
                                break;
                            case "se":
                                pntsDist += Math.PI / 2;
                                break
                        }
                        pnt1 = {
                            x: this.tailFactor * pntsLen * Math.cos(pntsDist) + this.drawPoints[0].x,
                            y: this.tailFactor * pntsLen * Math.sin(pntsDist) + this.drawPoints[0].y
                        };
                        pnt2 = {
                            x: -1 * this.tailFactor * pntsLen * Math.cos(pntsDist) + this.drawPoints[0].x,
                            y: -1 * this.tailFactor * pntsLen * Math.sin(pntsDist) + this.drawPoints[0].y
                        };
                        var pntsLen1 = (1 - this.headPercentage) * pntsLen;
                        pnt3 = {
                            x: this.tailFactor * pntsLen1 * Math.cos(pntsDist) + this.drawPoints[0].x,
                            y: this.tailFactor * pntsLen1 * Math.sin(pntsDist) + this.drawPoints[0].y
                        };
                        pnt4 = {
                            x: -1 * this.tailFactor * pntsLen1 * Math.cos(pntsDist) + this.drawPoints[0].x,
                            y: -1 * this.tailFactor * pntsLen1 * Math.sin(pntsDist) + this.drawPoints[0].y
                        };
                        drawPolygon = new Polygon(this.map.spatialReference);
                        pnts = [];
                        pnts.push(pnt1);
                        pnts.push(pnt3);
                        pnts = pnts.concat(this.CreateArrowHeadPathEx(pnt3, mapPoint, pnt4, pntsLen, this.headPercentage, 15));
                        pnts.push(pnt4);
                        pnts.push(pnt2);
                        pnts.push(pnt1);
                        !Polygon.prototype.isClockwise(pnts) && !this.respectDrawingVertexOrder && 
                        (console.debug(this.declaredClass + " :  Polygons drawn in anti-clockwise direction will be reversed to be clockwise."),
                            pnts.reverse());
                        drawPolygon.addRing(pnts);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                    } else {
                        drawPoints = [];
                        pnts1 = [];
                        pnts2 = [];
                        array.forEach(this.drawPoints, function(point) {
                            drawPoints.push({
                                x: point.x,
                                y: point.y
                            })
                        });
                        drawPoints.push({
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        vAngle = this.vertexAngle(drawPoints);
                        var pntsArrayLen = this.pntsCollectionLen(drawPoints, 0);
                        for (var i = 0,pntsLen = drawPoints.length - 1; i < pntsLen; i++) {
                            pntsLen1 = this.pntsCollectionLen(drawPoints, i);
                            pntsLen1 += pntsArrayLen / 2.4;
                            pnt1 = {
                                x: (this.tailFactor) * pntsLen1 * Math.cos(vAngle[i]) + drawPoints[i].x,
                                y: (this.tailFactor) * pntsLen1 * Math.sin(vAngle[i]) + drawPoints[i].y
                            };
                            pnt2 = {
                                x: -1 * (this.tailFactor) * pntsLen1 * Math.cos(vAngle[i]) + drawPoints[i].x,
                                y: -1 * (this.tailFactor) * pntsLen1 * Math.sin(vAngle[i]) + drawPoints[i].y
                            };
                            pnts1.push(pnt1);
                            pnts2.push(pnt2)
                        }
                        pnts1.push({
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        pnts2.push({
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        pnts1 = this.CreateBezierPathPCOnly(pnts1, 70);
                        pnts1.splice(Math.floor((1 - this.headPercentage) * 70), Number.MAX_VALUE);
                        pnts2 = this.CreateBezierPathPCOnly(pnts2, 70);
                        pnts2.splice(Math.floor((1 - this.headPercentage) * 70), Number.MAX_VALUE);
                        var arrowHeadPath = this.CreateArrowHeadPathEx(pnts1[pnts1.length - 1], mapPoint, pnts2[pnts2.length - 1], this.pntsCollectionLen(drawPoints, 0), this.headPercentage, 15);
                        pnts = [];
                        pnts = pnts.concat(pnts1);
                        pnts = pnts.concat(arrowHeadPath);
                        pnts = pnts.concat(pnts2.reverse());
                        pnts.push(pnts[0]);
                        drawPolygon = new Polygon(this.map.spatialReference);
                        drawPolygon.addRing(pnts);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                    }
                    break;
                case clazz.POLYLINEEX:
                    if (this.drawPoints.length <= 1) {
                        pntsLen = this._2PtLen(this.drawPoints[0], mapPoint);
                        pntsDist = Math.atan((this.drawPoints[0].y - mapPoint.y) / (this.drawPoints[0].x - mapPoint.x));
                        switch (this.twoPtsRelationShip(this.drawPoints[0], mapPoint)) {
                            case "ne":
                                pntsDist += Math.PI / 2;
                                break;
                            case "nw":
                                pntsDist += Math.PI * 3 / 2;
                                break;
                            case "sw":
                                pntsDist += Math.PI * 3 / 2;
                                break;
                            case "se":
                                pntsDist += Math.PI / 2;
                                break
                        }
                        pnt1 = {
                            x: this.tailFactor * pntsLen * Math.cos(pntsDist) + this.drawPoints[0].x,
                            y: this.tailFactor * pntsLen * Math.sin(pntsDist) + this.drawPoints[0].y
                        };
                        pnt2 = {
                            x: -1 * this.tailFactor * pntsLen * Math.cos(pntsDist) + this.drawPoints[0].x,
                            y: -1 * this.tailFactor * pntsLen * Math.sin(pntsDist) + this.drawPoints[0].y
                        };
                        drawPolygon = new Polygon(this.map.spatialReference);
                        pnts = [];
                        pnts.push(pnt1);
                        pnts.push(mapPoint);
                        pnts.push(pnt2);
                        pnts.push(pnt1);
                        !Polygon.prototype.isClockwise(pnts) && !this.respectDrawingVertexOrder &&
                        (console.debug(this.declaredClass + " :  Polygons drawn in anti-clockwise direction will be reversed to be clockwise."),
                            pnts.reverse());
                        drawPolygon.addRing(pnts);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                    } else {
                        drawPoints = [];
                        pnts1 = [];
                        pnts2 = [];
                        array.forEach(this.drawPoints, function(point) {
                            drawPoints.push({
                                x: point.x,
                                y: point.y
                            })
                        });
                        drawPoints.push({
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        vAngle = this.vertexAngle(drawPoints);
                        for (var i = 0,pntsLen = drawPoints.length - 1; i < pntsLen; i++) {
                            pntsLen1 = this.pntsCollectionLen(drawPoints, i);
                            pnt1 = {
                                x: (this.tailFactor + i / 18 / pntsLen) * pntsLen1 * Math.cos(vAngle[i]) + drawPoints[i].x,
                                y: (this.tailFactor + i / 18 / pntsLen) * pntsLen1 * Math.sin(vAngle[i]) + drawPoints[i].y
                            };
                            pnt2 = {
                                x: -1 * (this.tailFactor + i / 18 / pntsLen) * pntsLen1 * Math.cos(vAngle[i]) + drawPoints[i].x,
                                y: -1 * (this.tailFactor + i / 18 / pntsLen) * pntsLen1 * Math.sin(vAngle[i]) + drawPoints[i].y
                            };
                            pnts1.push(pnt1);
                            pnts2.push(pnt2)
                        }
                        pnts = [];
                        pnts = pnts.concat(pnts1);
                        pnts.push(mapPoint);
                        pnts = pnts.concat(pnts2.reverse());
                        pnts.push(pnts[0]);
                        drawPolygon = new Polygon(this.map.spatialReference);
                        !Polygon.prototype.isClockwise(pnts) && !this.respectDrawingVertexOrder &&
                        (console.debug(this.declaredClass + " :  Polygons drawn in anti-clockwise direction will be reversed to be clockwise."),
                            pnts.reverse());
                        drawPolygon.addRing(pnts);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(this.tempGraphic.geometry)
                    }
                    break;
                case clazz.DOUBLE_ARROW:
                case clazz.CUSTOM_ARROW:
                case clazz.CUSTOM_TAILED_ARROW:
                    if (this.curvePt1 && this.curvePt2) {
                        var originPoints = this.drawPoints.concat(mapPoint);
                        var drawPoints = PlotDrawer.createDrawPoints(this.geometryType, originPoints);
                        drawPolygon = new Polygon(this.map.spatialReference);
                        drawPolygon.addRing(drawPoints);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(drawPolygon);
                        this.setTooltipMessage(originPoints.length)
                    } else {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    }
                    break;
                case clazz.MULTI_ARROW:
                    var catPnts = this.drawPoints.concat(mapPoint);
                    if (this.curvePt1) {
                        if (catPnts.length % 3 == 0 || catPnts.length % 3 == 2) {
                            var plotDrawer = PlotDrawer.createDrawPoints(this.geometryType, catPnts);
                            drawPolygon = new Polygon(this.map.spatialReference);
                            drawPolygon.addRing(plotDrawer);
                            this.tempGraphic.geometry = drawPolygon;
                            this.tempGraphic.setGeometry(drawPolygon)
                        } else {
                            if (catPnts.length % 3 == 1) {
                                var plotDrawer = PlotDrawer.createDrawPoints(this.geometryType, this.drawPoints);
                                var drawPolygon = new Polygon(this.map.spatialReference);
                                drawPolygon.addRing(plotDrawer);
                                this.tempGraphic.geometry = drawPolygon;
                                this.tempGraphic.setGeometry(drawPolygon)
                            }
                        }
                        this.setTooltipMessage(catPnts.length)
                    } else {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    }
                    break;
                case clazz.SIMPLE_ARROW:
                case clazz.TAILED_ARROW:
                case clazz.STRAIGHT_ARROW:
                    if (this.curvePt1) {
                        var catPnts = this.drawPoints.concat(mapPoint);
                        var plotDrawer = PlotDrawer.createDrawPoints(this.geometryType, catPnts);
                        drawPolygon = new Polygon(this.map.spatialReference);
                        drawPolygon.addRing(plotDrawer);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(drawPolygon);
                        this.setTooltipMessage(catPnts.length)
                    } else {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    }
                    break;
                case clazz.HALF_CIRCLE:
                    if (this.curvePt1) {
                        var catPoints = this.drawPoints.concat(mapPoint);
                        var plotDrawer = PlotDrawer.createDrawPoints(this.geometryType, catPoints);
                        drawPolygon = new Polygon(this.map.spatialReference);
                        drawPolygon.addRing(plotDrawer);
                        this.tempGraphic.geometry = drawPolygon;
                        this.tempGraphic.setGeometry(drawPolygon);
                        this.setTooltipMessage(catPoints.length)
                    } else {
                        geometry.setPoint(0, 0, {
                            x: endPoint.x,
                            y: endPoint.y
                        });
                        geometry.setPoint(0, 1, {
                            x: mapPoint.x,
                            y: mapPoint.y
                        });
                        this.tempGraphic.setGeometry(geometry)
                    }
                    break
            }
        },
        onMouseDragHandler: function(evt) {
            if (has("esri-touch") && !this.drawPoints.length) {
                evt.preventDefault()
            } else {
                this.dragged = true;
                var firstPnt = this.drawPoints[0];
                var mapPnt = evt.mapPoint;
                var firstMapPnt = this.map.toScreen(firstPnt);
                var mMapPnt = this.map.toScreen(mapPnt);
                var absX = mMapPnt.x - firstMapPnt.x;
                var absY = mMapPnt.y - firstMapPnt.y;
                var absDis = Math.sqrt(absX * absX + absY * absY);
                switch (this.geometryType) {
                    case clazz.CIRCLE:
                        this.hideTooltip();
                        this.drawGraphic.geometry = Polygon.createCircle({
                            center: firstMapPnt,
                            r: absDis,
                            numberOfPoints: 60,
                            map: this.map
                        });
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.ELLIPSE:
                        this.hideTooltip();
                        this.drawGraphic.geometry = Polygon.createEllipse({
                            center: firstMapPnt,
                            longAxis: absX,
                            shortAxis: absY,
                            numberOfPoints: 60,
                            map: this.map
                        });
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.TRIANGLE:
                        this.hideTooltip();
                        absX = [[0, -absDis], [0.866025403784439 * absDis, 0.5 * absDis], [-0.866025403784439 * absDis, 0.5 * absDis], [0, -absDis]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.ARROW:
                        this.hideTooltip();
                        var N1 = absY / absDis;
                        var N2 = absX / absDis;
                        var N3 = 0.25 * N2 * absDis;
                        var N4 = 0.25 * absDis / (absY / absX);
                        absDis *= 0.25 * N1;
                        absX = [[absX, absY], [absX - N3 * (1 + 24 / N4), absY + 24 * N2 - absDis], [absX - N3 * (1 + 12 / N4), absY + 12 * N2 - absDis], [-12 * N1, 12 * N2], [12 * N1, -12 * N2], [absX - N3 * (1 - 12 / N4), absY - 12 * N2 - absDis], [absX - N3 * (1 - 24 / N4), absY - 24 * N2 - absDis], [absX, absY]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.LEFT_ARROW:
                        this.hideTooltip();
                        absX = 0 >= absX ? [[absX, 0], [0.75 * absX, absY], [0.75 * absX, 0.5 * absY], [0, 0.5 * absY], [0, -0.5 * absY], [0.75 * absX, -0.5 * absY], [0.75 * absX, -absY], [absX, 0]] : [[0, 0], [0.25 * absX, absY], [0.25 * absX, 0.5 * absY], [absX, 0.5 * absY], [absX, -0.5 * absY], [0.25 * absX, -0.5 * absY], [0.25 * absX, -absY], [0, 0]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.RIGHT_ARROW:
                        this.hideTooltip();
                        absX = 0 <= absX ? [[absX, 0], [0.75 * absX, absY], [0.75 * absX, 0.5 * absY], [0, 0.5 * absY], [0, -0.5 * absY], [0.75 * absX, -0.5 * absY], [0.75 * absX, -absY], [absX, 0]] : [[0, 0], [0.25 * absX, absY], [0.25 * absX, 0.5 * absY], [absX, 0.5 * absY], [absX, -0.5 * absY], [0.25 * absX, -0.5 * absY], [0.25 * absX, -absY], [0, 0]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.UP_ARROW:
                        this.hideTooltip();
                        absX = 0 >= absY ? [[0, absY], [-absX, 0.75 * absY], [-0.5 * absX, 0.75 * absY], [-0.5 * absX, 0], [0.5 * absX, 0], [0.5 * absX, 0.75 * absY], [absX, 0.75 * absY], [0, absY]] : [[0, 0], [-absX, 0.25 * absY], [-0.5 * absX, 0.25 * absY], [-0.5 * absX, absY], [0.5 * absX, absY], [0.5 * absX, 0.25 * absY], [absX, 0.25 * absY], [0, 0]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.DOWN_ARROW:
                        this.hideTooltip();
                        absX = 0 <= absY ? [[0, absY], [-absX, 0.75 * absY], [-0.5 * absX, 0.75 * absY], [-0.5 * absX, 0], [0.5 * absX, 0], [0.5 * absX, 0.75 * absY], [absX, 0.75 * absY], [0, absY]] : [[0, 0], [-absX, 0.25 * absY], [-0.5 * absX, 0.25 * absY], [-0.5 * absX, absY], [0.5 * absX, absY], [0.5 * absX, 0.25 * absY], [absX, 0.25 * absY], [0, 0]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.RECTANGLE:
                        this.hideTooltip();
                        absX = [[0, 0], [absX, 0], [absX, absY], [0, absY], [0, 0]];
                        this.drawGraphic.geometry = this.toPolygon(absX, firstMapPnt.x, firstMapPnt.y);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.LINE:
                        this.drawGraphic.setGeometry(lang.mixin(this.drawGraphic.geometry, {
                            paths: [[[firstPnt.x, firstPnt.y], [mapPnt.x, mapPnt.y]]]
                        }));
                        break;
                    case clazz.EXTENT:
                        this.drawGraphic && this.map.graphics.remove(this.drawGraphic, !0);
                        this.drawGraphic = new Rect(this.normalizeRect(firstPnt, mapPnt, this.map.spatialReference));
                        this.drawGraphic._originOnly = !0;
                        this.drawGraphic = this.map.graphics.add(new Graphic(this.drawGraphic,this.fillSymbol), !0);
                        this.map.snappingManager && this.map.snappingManager._setGraphic(this.drawGraphic);
                        break;
                    case clazz.FREEHAND_POLYLINE:
                        this.hideTooltip();
                        if (false === this.canDrawFreehandPoint(evt)) {
                            has("esri-touch") && evt.preventDefault();
                            return
                        }
                        this.drawPoints.push(evt.mapPoint.offset(0, 0));
                        this.drawGraphic.geometry._insertPoints([mapPnt.offset(0, 0)], 0);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.FREEHAND_POLYGON:
                        this.hideTooltip();
                        if (false === this.canDrawFreehandPoint(evt)) {
                            has("esri-touch") && evt.preventDefault();
                            return
                        }
                        this.drawPoints.push(evt.mapPoint.offset(0, 0));
                        this.drawGraphic.geometry._insertPoints([mapPnt.offset(0, 0)], 0);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break;
                    case clazz.RECT_FLAG:
                    case clazz.TRIANGLE_FLAG:
                    case clazz.ASSEMBLY_AREA:
                        this.hideTooltip();
                        var drawPoints = [firstPnt, mapPnt];
                        var drawerPoints = PlotDrawer.createDrawPoints(this.geometryType, drawPoints);
                        var polygon = new Polygon(this.map.spatialReference);
                        polygon.addRing(drawerPoints);
                        this.drawGraphic.geometry = polygon;
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                        break
                }
                has("esri-touch") && evt.preventDefault()
            }
        },
        onMouseUpHandler: function(evt) {
            if (this.dragged) {
                this.drawPoints.length ===0 && this.drawPoints.push(evt.mapPoint.offset(0, 0));
                var firstPnt = this.drawPoints[0];
                var  drawGeometry;
                switch (this.geometryType) {
                    case clazz.CIRCLE:
                    case clazz.ELLIPSE:
                    case clazz.TRIANGLE:
                    case clazz.ARROW:
                    case clazz.LEFT_ARROW:
                    case clazz.RIGHT_ARROW:
                    case clazz.UP_ARROW:
                    case clazz.DOWN_ARROW:
                    case clazz.RECTANGLE:
                    case clazz.RECT_FLAG:
                    case clazz.TRIANGLE_FLAG:
                    case clazz.ASSEMBLY_AREA:
                        drawGeometry = this.drawGraphic.geometry;
                        break;
                    case clazz.LINE:
                        drawGeometry = new Polyline({
                            paths: [[[firstPnt.x, firstPnt.y], [evt.mapPoint.x, evt.mapPoint.y]]],
                            spatialReference: this.map.spatialReference
                        });
                        break;
                    case clazz.EXTENT:
                        drawGeometry = (new Rect(this.normalizeRect(firstPnt, evt.mapPoint, this.map.spatialReference))).getExtent();
                        break;
                    case clazz.FREEHAND_POLYLINE:
                        drawGeometry = new Polyline(this.map.spatialReference);
                        drawGeometry.addPath([].concat(this.drawPoints, [evt.mapPoint.offset(0, 0)]));
                        break;
                    case clazz.FREEHAND_POLYGON:
                        drawGeometry = new Polygon(this.map.spatialReference),
                            firstPnt = [].concat(this.drawPoints, [evt.mapPoint.offset(0, 0), this.drawPoints[0].offset(0, 0)]),
                        !Polygon.prototype.isClockwise(firstPnt) && !this.respectDrawingVertexOrder &&
                        (console.debug(this.declaredClass + " :  Polygons drawn in anti-clockwise direction will be reversed to be clockwise."),
                            firstPnt.reverse()),
                            drawGeometry.addRing(firstPnt)
                }
                has("esri-touch") && evt.preventDefault();
                this.clear();
                this.drawEnd(drawGeometry)
            } else {
                this.clear()
            }
        },
        onClickHandler: function(evt) {
            var evtPnt = evt.mapPoint;
            var mapPnt = this.map.toScreen(evtPnt);
            var drawGeometry,drawGraphic;
            this.drawPoints.push(evtPnt.offset(0, 0));
            switch (this.geometryType) {
                case clazz.POINT:
                case clazz.POINT_TEXT:
                    var pointText = evtPnt.offset(0, 0);
                    pointText.drawExtendType = this.geometryType;
                    this.drawEnd(pointText);
                    this.setTooltipMessage(0);
                    break;
                case clazz.POLYLINE:
                    if (this.drawPoints.length === 1) {
                        drawGeometry = new Polyline(this.map.spatialReference);
                        drawGeometry.addPath(this.drawPoints);
                        this.drawGraphic = this.map.graphics.add(new Graphic(drawGeometry,this.lineSymbol), true);
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler));
                        this.tempGraphic = this.map.graphics.add(
                            new Graphic(new Polyline({
                                    paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                                    spatialReference: this.map.spatialReference
                                }),
                                this.lineSymbol), true)
                    } else {
                        this.drawGraphic.geometry._insertPoints([evtPnt.offset(0, 0)], 0);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry).setSymbol(this.lineSymbol);
                        drawGraphic = this.tempGraphic;
                        drawGeometry = drawGraphic.geometry;
                        drawGeometry.setPoint(0, 0, evtPnt.offset(0, 0));
                        drawGeometry.setPoint(0, 1, evtPnt.offset(0, 0));
                        drawGraphic.setGeometry(drawGeometry)
                    }
                    break;
                case clazz.POLYLINEEX:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(
                            new Graphic(new Polygon({
                                rings: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                                spatialReference: this.map.spatialReference
                            }), this.fillSymbol), true);
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this, this.onMouseMoveHandler))
                    }
                    break;
                case clazz.POLYGON:
                    if (this.drawPoints.length === 1) {
                        drawGeometry = new Polygon(this.map.spatialReference);
                        drawGeometry.addRing(this.drawPoints);
                        this.drawGraphic = this.map.graphics.add(new Graphic(drawGeometry,this.fillSymbol), true);
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler));
                        this.tempGraphic = this.map.graphics.add(
                            new Graphic(new Polyline({
                                paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                                spatialReference: this.map.spatialReference
                            }), this.fillSymbol), true)
                    } else {
                        this.drawGraphic.geometry._insertPoints([evtPnt.offset(0, 0)], 0);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry).setSymbol(this.fillSymbol);
                        drawGraphic = this.tempGraphic;
                        drawGeometry = drawGraphic.geometry;
                        drawGeometry.setPoint(0, 0, evtPnt.offset(0, 0));
                        drawGeometry.setPoint(0, 1, evtPnt.offset(0, 0));
                        drawGraphic.setGeometry(drawGeometry)
                    }
                    break;
                case clazz.MULTI_POINT:
                    evtPnt = this.drawPoints;
                    if (evtPnt.length === 1) {
                        var multiPoint = new Multipoint(this.map.spatialReference);
                        multiPoint.addPoint(evtPnt[evtPnt.length - 1]);
                        this.drawGraphic = this.map.graphics.add(new Graphic(multiPoint,this.markerSymbol), true);
                    } else {
                        this.drawGraphic.geometry.addPoint(evtPnt[evtPnt.length - 1]);
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry).setSymbol(this.markerSymbol)
                    }
                    break;
                case clazz.ARROW:
                    evtPnt = [[0, 0], [-24, 24], [-24, 12], [-96, 12], [-96, -12], [-24, -12], [-24, -24], [0, 0]];
                    var evtPntX = mapPnt.x;
                    var evtPntY = mapPnt.y;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.LEFT_ARROW:
                    evtPnt = [[0, 0], [24, 24], [24, 12], [96, 12], [96, -12], [24, -12], [24, -24], [0, 0]];
                    var evtPntX = mapPnt.x;
                    var evtPntY = mapPnt.y;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.RIGHT_ARROW:
                    evtPnt = [[0, 0], [-24, 24], [-24, 12], [-96, 12], [-96, -12], [-24, -12], [-24, -24], [0, 0]];
                    var evtPntX = mapPnt.x;
                    var evtPntY = mapPnt.y;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.UP_ARROW:
                    evtPnt = [[0, 0], [-24, 24], [-12, 24], [-12, 96], [12, 96], [12, 24], [24, 24], [0, 0]];
                    var evtPntX = mapPnt.x;
                    var evtPntY = mapPnt.y;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.DOWN_ARROW:
                    evtPnt = [[0, 0], [-24, -24], [-12, -24], [-12, -96], [12, -96], [12, -24], [24, -24], [0, 0]];
                    var evtPntX = mapPnt.x;
                    var evtPntY = mapPnt.y;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.TRIANGLE:
                    evtPnt = [[0, -48], [41.5692193816531, 24], [-41.5692193816531, 24], [0, -48]];
                    var evtPntX = mapPnt.x;
                    var evtPntY = mapPnt.y;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.RECTANGLE:
                    evtPnt = [[0, -96], [96, -96], [96, 0], [0, 0], [0, -96]];
                    var evtPntX = mapPnt.x - 48;
                    var evtPntY = mapPnt.y+ 48;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.CIRCLE:
                    var polygon = new Polygon(this.map.spatialReference);
                    this.drawGraphic = this.map.graphics.add(new Graphic(polygon,this.fillSymbol), !0);
                    this.drawGraphic.geometry = Polygon.createCircle({
                        center: mapPnt,
                        r: 48,
                        numberOfPoints: 60,
                        map: this.map
                    });
                    this.drawGraphic.setGeometry(this.drawGraphic.geometry);
                    this.drawEnd(this.drawGraphic.geometry);
                    break;
                case clazz.ELLIPSE:
                    clazz = new Polygon(this.map.spatialReference),
                        this.drawGraphic = this.map.graphics.add(new Graphic(clazz,this.fillSymbol), true),
                        this.drawGraphic.geometry = Polygon.createEllipse({
                            center: mapPnt,
                            longAxis: 48,
                            shortAxis: 24,
                            numberOfPoints: 60,
                            map: this.map
                        }),
                        this.drawGraphic.setGeometry(this.drawGraphic.geometry),
                        this.drawEnd(this.drawGraphic.geometry);
                    break;
                case clazz.CURVE:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.curvePt1 = this.drawPoints[this.drawPoints.length - 1];
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    } else {
                        if (this.drawPoints.length === 2) {
                            this.curvePt2 = this.drawPoints[this.drawPoints.length - 1]
                        }
                    }
                    break;
                case clazz.BEZIER_CURVE:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    }
                    break;
                case clazz.BEZIER_POLYGON:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polygon({
                            rings: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.fillSymbol), true);
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    }
                    break;
                case clazz.FREEHAND_ARROW:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polygon({
                            rings: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.fillSymbol), !0);
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    }
                    break;
                case clazz.RECT_FLAG:
                    evtPnt = [[52, 76], [52, 17], [97, 17], [97, 47], [52, 47], [52, 76]];
                    var evtPntX = mapPnt.x - 48;
                    var evtPntY = mapPnt.y - 72;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.TRIANGLE_FLAG:
                    evtPnt = [[57, 59], [57, 8], [91, 34], [57, 34], [57, 59]];
                    var evtPntX = mapPnt.x - 56;
                    var evtPntY = mapPnt.y - 55;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.ASSEMBLY_AREA:
                    evtPnt = [[39, 41], [39, 42], [40, 42], [40, 42], [41, 42], [41, 42], [42, 43], [42, 43], [43, 43], [43, 43], [43, 43], [44, 44], [44, 44], [45, 44], [45, 44], [46, 44], [46, 44], [47, 45], [47, 45], [48, 45], [48, 45], [48, 45], [49, 45], [49, 45], [50, 45], [50, 45], [51, 46], [51, 46], [51, 46], [52, 46], [52, 46], [53, 46], [53, 46], [54, 46], [54, 46], [54, 46], [55, 46], [55, 46], [56, 46], [56, 46], [56, 46], [57, 46], [57, 46], [58, 46], [58, 46], [58, 46], [59, 46], [59, 46], [60, 46], [60, 46], [60, 46], [61, 46], [61, 46], [62, 46], [62, 46], [62, 46], [63, 46], [63, 46], [63, 46], [64, 46], [64, 46], [65, 46], [65, 46], [65, 46], [66, 46], [66, 46], [66, 46], [67, 46], [67, 46], [68, 46], [68, 46], [68, 45], [69, 45], [69, 45], [69, 45], [70, 45], [70, 45], [70, 45], [71, 45], [71, 45], [72, 45], [72, 44], [72, 44], [73, 44], [73, 44], [73, 44], [74, 44], [74, 44], [75, 44], [75, 44], [75, 43], [76, 43], [76, 43], [76, 43], [77, 43], [77, 43], [77, 43], [78, 42], [78, 42], [79, 42], [79, 42], [79, 42], [79, 42], [79, 42], [79, 42], [80, 42], [80, 42], [80, 42], [80, 42], [80, 41], [80, 41], [80, 41], [80, 41], [80, 41], [80, 41], [80, 41], [81, 41], [81, 41], [81, 41], [81, 40], [81, 40], [81, 40], [81, 40], [81, 40], [81, 40], [81, 40], [81, 40], [81, 39], [81, 39], [81, 39], [81, 39], [81, 39], [81, 39], [81, 39], [81, 38], [81, 38], [81, 38], [81, 38], [81, 38], [81, 38], [81, 38], [81, 37], [81, 37], [81, 37], [81, 37], [80, 37], [80, 37], [80, 36], [80, 36], [80, 36], [80, 36], [80, 36], [80, 36], [80, 35], [80, 35], [80, 35], [80, 35], [80, 35], [79, 35], [79, 34], [79, 34], [79, 34], [79, 34], [79, 34], [79, 34], [79, 33], [79, 33], [78, 33], [78, 33], [78, 33], [78, 33], [78, 32], [78, 32], [78, 32], [78, 32], [77, 32], [77, 32], [77, 31], [77, 31], [77, 31], [77, 31], [77, 31], [76, 31], [76, 30], [76, 30], [76, 30], [76, 30], [76, 30], [75, 30], [75, 29], [75, 29], [75, 29], [75, 29], [75, 29], [75, 29], [74, 29], [74, 28], [74, 28], [74, 28], [74, 28], [74, 28], [73, 28], [73, 28], [73, 28], [73, 27], [73, 27], [72, 27], [72, 27], [72, 27], [72, 27], [72, 27], [71, 26], [71, 26], [71, 26], [71, 26], [70, 26], [70, 26], [70, 26], [70, 26], [70, 26], [69, 25], [69, 25], [69, 25], [69, 25], [69, 25], [68, 25], [68, 25], [68, 25], [68, 25], [68, 25], [67, 25], [67, 25], [67, 25], [67, 25], [67, 25], [66, 25], [66, 25], [66, 25], [66, 25], [66, 24], [65, 24], [65, 24], [65, 24], [65, 24], [65, 24], [65, 24], [64, 24], [64, 24], [64, 24], [64, 24], [64, 24], [63, 24], [63, 24], [63, 24], [63, 24], [63, 24], [62, 24], [62, 24], [62, 24], [62, 24], [62, 24], [61, 24], [61, 24], [61, 24], [61, 24], [61, 24], [60, 24], [60, 24], [60, 24], [60, 24], [60, 24], [59, 24], [59, 24], [59, 24], [59, 24], [59, 24], [58, 24], [58, 24], [58, 24], [58, 24], [58, 24], [57, 24], [57, 24], [57, 23], [57, 23], [56, 23], [56, 23], [56, 23], [56, 23], [55, 23], [55, 23], [55, 23], [55, 23], [54, 23], [54, 22], [54, 22], [54, 22], [53, 22], [53, 22], [53, 22], [53, 22], [52, 22], [52, 21], [52, 21], [52, 21], [51, 21], [51, 21], [51, 21], [50, 20], [50, 20], [50, 20], [49, 20], [49, 20], [49, 19], [49, 19], [48, 19], [48, 19], [48, 19], [48, 18], [47, 18], [47, 18], [47, 18], [47, 17], [47, 17], [46, 17], [46, 17], [46, 17], [46, 16], [46, 16], [45, 16], [45, 16], [45, 16], [45, 15], [45, 15], [44, 15], [44, 15], [44, 15], [44, 14], [44, 14], [44, 14], [44, 14], [43, 14], [43, 13], [43, 13], [43, 13], [43, 13], [43, 13], [43, 12], [42, 12], [42, 12], [42, 12], [42, 12], [42, 11], [42, 11], [42, 11], [41, 11], [41, 11], [41, 10], [41, 10], [41, 10], [41, 10], [41, 10], [40, 10], [40, 9], [40, 9], [40, 9], [40, 9], [40, 9], [40, 8], [39, 8], [39, 8], [39, 8], [39, 8], [39, 8], [39, 7], [38, 7], [38, 7], [38, 7], [38, 7], [38, 7], [38, 7], [37, 6], [37, 6], [37, 6], [37, 6], [37, 6], [36, 6], [36, 6], [36, 5], [36, 5], [35, 5], [35, 5], [35, 5], [35, 5], [34, 5], [34, 5], [34, 4], [33, 4], [33, 4], [33, 4], [33, 4], [32, 4], [32, 4], [32, 4], [32, 4], [31, 4], [31, 4], [31, 4], [31, 4], [30, 4], [30, 3], [30, 3], [29, 3], [29, 3], [29, 3], [29, 3], [28, 3], [28, 3], [28, 3], [28, 3], [27, 3], [27, 3], [27, 3], [26, 3], [26, 3], [26, 3], [26, 3], [25, 3], [25, 3], [25, 3], [24, 3], [24, 3], [24, 3], [24, 3], [23, 3], [23, 3], [23, 3], [22, 3], [22, 3], [22, 3], [22, 3], [21, 3], [21, 3], [21, 3], [21, 4], [20, 4], [20, 4], [20, 4], [20, 4], [19, 4], [19, 4], [19, 4], [19, 4], [18, 4], [18, 4], [18, 4], [18, 4], [17, 4], [17, 4], [17, 5], [17, 5], [16, 5], [16, 5], [16, 5], [16, 5], [16, 5], [15, 5], [15, 5], [15, 5], [15, 6], [15, 6], [15, 6], [14, 6], [14, 6], [14, 6], [14, 6], [14, 6], [14, 7], [13, 7], [13, 7], [13, 7], [13, 7], [13, 7], [13, 7], [13, 8], [13, 8], [13, 8], [12, 8], [12, 8], [12, 8], [12, 9], [12, 9], [12, 9], [12, 9], [12, 9], [12, 9], [12, 10], [12, 10], [12, 10], [12, 10], [12, 10], [12, 10], [12, 11], [12, 11], [12, 11], [12, 11], [14, 23], [39, 41]];
                    var evtPntX = mapPnt.x - 48;
                    var evtPntY = mapPnt.y - 32;
                    this.addShape(evtPnt, evtPntX, evtPntY);
                    break;
                case clazz.DOUBLE_ARROW:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.curvePt1 = this.drawPoints[this.drawPoints.length - 1];
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    } else {
                        if (this.drawPoints.length === 2) {
                            this.curvePt2 = this.drawPoints[this.drawPoints.length - 1];
                            this.setTooltipMessage(2)
                        } else {
                            if (this.drawPoints.length === 4) {
                                var polygon = new Polygon(this.map.spatialReference);
                                var polygonPnts = PlotDrawer.createDrawPoints(this.geometryType, this.drawPoints);
                                polygon.addRing(polygonPnts);
                                var clonePnts = lang.clone(this.drawPoints);
                                polygon.controlPoints = clonePnts;
                                polygon.drawExtendType = this.geometryType;
                                connect.disconnect(this.onMouseMoveConnect);
                                this.clear();
                                this.setTooltipMessage(0);
                                this.drawEnd(polygon)
                            }
                        }
                    }
                    break;
                case clazz.MULTI_ARROW:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.curvePt1 = this.drawPoints[this.drawPoints.length - 1];
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    } else {
                        if (this.drawPoints.length < 9) {
                        } else {
                            if (this.drawPoints.length === 9) {
                                var polygon = new Polygon(this.map.spatialReference);
                                var polygonPnts = PlotDrawer.createDrawPoints(this.geometryType, this.drawPoints);
                                polygon.addRing(polygonPnts);
                                var clonePnts = lang.clone(this.drawPoints);
                                polygon.controlPoints = clonePnts;
                                polygon.drawExtendType = this.geometryType;
                                connect.disconnect(this.onMouseMoveConnect);
                                this.clear();
                                this.setTooltipMessage(0);
                                this.drawEnd(polygon)
                            }
                        }
                    }
                    break;
                case clazz.HALF_CIRCLE:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.curvePt1 = this.drawPoints[this.drawPoints.length - 1];
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    } else {
                        if (this.drawPoints.length === 2) {
                            var polygon = new Polygon(this.map.spatialReference);
                            var polygonPnts = PlotDrawer.createDrawPoints(this.geometryType, this.drawPoints);
                            polygon.addRing(polygonPnts);
                            var clonePnts = lang.clone(this.drawPoints);
                            polygon.controlPoints = clonePnts;
                            polygon.drawExtendType = this.geometryType;
                            connect.disconnect(this.onMouseMoveConnect);
                            this.clear();
                            this.setTooltipMessage(0);
                            this.drawEnd(polygon)
                        }
                    }
                    break;
                case clazz.CUSTOM_ARROW:
                case clazz.CUSTOM_TAILED_ARROW:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.curvePt1 = this.drawPoints[this.drawPoints.length - 1];
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    } else {
                        if (this.drawPoints.length >= 2) {
                            this.curvePt2 = this.drawPoints[this.drawPoints.length - 1]
                        }
                    }
                    break;
                case clazz.SIMPLE_ARROW:
                case clazz.TAILED_ARROW:
                case clazz.STRAIGHT_ARROW:
                    if (this.drawPoints.length === 1) {
                        this.tempGraphic = this.map.graphics.add(new Graphic(new Polyline({
                            paths: [[[evtPnt.x, evtPnt.y], [evtPnt.x, evtPnt.y]]],
                            spatialReference: this.map.spatialReference
                        }),this.lineSymbol), true);
                        this.curvePt1 = this.drawPoints[this.drawPoints.length - 1];
                        this.onMouseMoveConnect = connect.connect(this.map, "onMouseMove", lang.hitch(this,this.onMouseMoveHandler))
                    } else {
                        if (this.drawPoints.length > 1) {
                            this.curvePt2 = this.drawPoints[this.drawPoints.length - 1]
                        }
                    }
                    break
            }
            this.setTooltipMessage(this.drawPoints.length)
        },
        onDblClickHandler: function(evt) {
            var drawGeometry, drawGeometryPnts = this.drawPoints;
            has("esri-touch") && drawGeometryPnts.push(evt.mapPoint);
            drawGeometryPnts = drawGeometryPnts.slice(0, drawGeometryPnts.length);
            switch (this.geometryType) {
                case clazz.POLYLINE:
                    if (!this.drawGraphic || 2 > drawGeometryPnts.length) {
                        connect.disconnect(this.onMouseMoveConnect);
                        this.clear();
                        this.onClickHandler(evt);
                        return
                    }
                    drawGeometry = new Polyline(this.map.spatialReference);
                    drawGeometry.addPath([].concat(drawGeometryPnts));
                    break;
                case clazz.POLYGON:
                    if (!this.drawGraphic || 2 > drawGeometryPnts.length) {
                        connect.disconnect(this.onMouseMoveConnect);
                        this.clear();
                        this.onClickHandler(evt);
                        return
                    }
                    drawGeometry = new Polygon(this.map.spatialReference);
                    var bPoints = [].concat(drawGeometryPnts, [drawGeometryPnts[0].offset(0, 0)]);
                    !Polygon.prototype.isClockwise(bPoints) && !this.respectDrawingVertexOrder &&
                    (console.debug(this.declaredClass + " :  Polygons drawn in anti-clockwise direction will be reversed to be clockwise."),
                        bPoints.reverse());
                    drawGeometry.addRing(bPoints);
                    break;
                case clazz.MULTI_POINT:
                    drawGeometry = new Multipoint(this.map.spatialReference);
                    array.forEach(drawGeometryPnts, function(geometryPnt) {
                        drawGeometry.addPoint(geometryPnt)
                    });
                    break;
                case clazz.CURVE:
                    if (drawGeometryPnts.length > 2) {
                        drawGeometry = this.tempGraphic.geometry;
                        var clonePoints = lang.clone(this.drawPoints);
                        drawGeometry.controlPoints = clonePoints;
                        drawGeometry.drawExtendType = "curve"
                    }
                    break;
                case clazz.BEZIER_CURVE:
                    if (drawGeometryPnts.length > 2) {
                        drawGeometry = this.tempGraphic.geometry;
                        var clonePoints = lang.clone(this.drawPoints);
                        drawGeometry.controlPoints = clonePoints;
                        drawGeometry.drawExtendType = "beziercurve"
                    }
                    break;
                case clazz.BEZIER_POLYGON:
                    if (drawGeometryPnts.length > 2) {
                        drawGeometry = this.tempGraphic.geometry;
                        var clonePoints = lang.clone(this.drawPoints);
                        drawGeometry.controlPoints = clonePoints;
                        drawGeometry.drawExtendType = "bezierpolygon"
                    }
                    break;
                case clazz.FREEHAND_ARROW:
                    if (drawGeometryPnts.length > 1) {
                        drawGeometry = this.tempGraphic.geometry;
                        var clonePoints = lang.clone(this.drawPoints);
                        drawGeometry.controlPoints = clonePoints;
                        drawGeometry.drawExtendType = "freehandarrow"
                    }
                    break;
                case clazz.POLYLINEEX:
                    if (drawGeometryPnts.length > 1) {
                        drawGeometry = this.tempGraphic.geometry
                    }
                    break;
                case clazz.DOUBLE_ARROW:
                case clazz.CUSTOM_ARROW:
                case clazz.CUSTOM_TAILED_ARROW:
                    if (drawGeometryPnts.length > 2) {
                        drawGeometry = this.tempGraphic.geometry;
                        var clonePoints = lang.clone(this.drawPoints);
                        drawGeometry.controlPoints = clonePoints;
                        drawGeometry.drawExtendType = this.geometryType
                    }
                    break;
                case clazz.SIMPLE_ARROW:
                case clazz.TAILED_ARROW:
                case clazz.STRAIGHT_ARROW:
                case clazz.HALF_CIRCLE:
                case clazz.MULTI_ARROW:
                    if (drawGeometryPnts.length > 1) {
                        drawGeometry = this.tempGraphic.geometry;
                        var clonePoints = lang.clone(this.drawPoints);
                        drawGeometry.controlPoints = clonePoints;
                        drawGeometry.drawExtendType = this.geometryType
                    }
                    break
            }
            connect.disconnect(this.onMouseMoveConnect);
            this.clear();
            this.setTooltipMessage(0);
            this.drawEnd(drawGeometry)
        },
        onKeyDownHandler: function(evt) {
            evt.keyCode === keys.ESCAPE && (connect.disconnect(this.onMouseMoveConnect),
                this.clear(),
                this.setTooltipMessage(0))
        },
        //地图范围改变
        reDrawGraphic: function(delta, extent, levelChange, lod) {
            if (levelChange || this.map.wrapAround180) {
                (delta = this.drawGraphic) && delta.setGeometry(delta.geometry),
                (delta = this.tempGraphic) && delta.setGeometry(delta.geometry)
            }
        },
        //--------------------------------------------------------------------------------------------------------------

        //弧线----------------------------------------------------------------------------
        circleDrawEx: function(pnt1, pnt2, pnt3) {
            var radius, pntx, pnty, k1, k2, k3, k4;
            var m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
            var drawPoints = [[pnt1.x, pnt1.y], [pnt2.x, pnt2.y], [pnt3.x, pnt3.y]];
            for (var j = 0; j < 3; j++) {
                m[j][0] = drawPoints[j][0];
                m[j][1] = drawPoints[j][1];
                m[j][2] = 1
            }
            k1 = this.determinantDrawEx(m, 3);
            for (var j = 0; j < 3; j++) {
                m[j][0] = drawPoints[j][0] * drawPoints[j][0] + drawPoints[j][1] * drawPoints[j][1];
                m[j][1] = drawPoints[j][1];
                m[j][2] = 1
            }
            k2 = this.determinantDrawEx(m, 3);
            for (var j = 0; j < 3; j++) {
                m[j][0] = drawPoints[j][0] * drawPoints[j][0] + drawPoints[j][1] * drawPoints[j][1];
                m[j][1] = drawPoints[j][0];
                m[j][2] = 1
            }
            k3 = this.determinantDrawEx(m, 3);
            for (var j = 0; j < 3; j++) {
                m[j][0] = drawPoints[j][0] * drawPoints[j][0] + drawPoints[j][1] * drawPoints[j][1];
                m[j][1] = drawPoints[j][0];
                m[j][2] = drawPoints[j][1]
            }
            k4 = this.determinantDrawEx(m, 3);
            if (k1 == 0) {
                radius = 0
            } else {
                pntx = 0.5 * k2 / k1;
                pnty = -0.5 * k3 / k1;
                radius = Math.sqrt(pntx * pntx + pnty * pnty + k4 / k1)
            }
            return {
                radius: radius,
                center: {
                    x: pntx,
                    y: pnty
                }
            }
        },
        determinantDrawEx: function(pnts, n) {
            var k1, k2, k3, k4;
            var dist = 0;
            var m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
            if (n == 2) {
                dist = pnts[0][0] * pnts[1][1] - pnts[1][0] * pnts[0][1]
            } else {
                dist = 0;
                for (k3 = 0; k3 < n; k3++) {
                    for (k1 = 1; k1 < n; k1++) {
                        k4 = 0;
                        for (k2 = 0; k2 < n; k2++) {
                            if (k2 == k3) {
                                continue
                            }
                            m[k1 - 1][k4] = pnts[k1][k2];
                            k4++
                        }
                    }
                    dist = dist + Math.pow(-1, k3) * pnts[0][k3] * this.determinantDrawEx(m, n - 1)
                }
            }
            return dist
        },
        CreateCircleSegmentFromThreePoints: function(circle, curvePt1, curvePt2, curvePt, n, map) {
            var centerPnt = circle.center, radius = circle.radius, drawPoints = [];
            curvePt1.x -= centerPnt.x;
            curvePt1.y -= centerPnt.y;
            curvePt2.x -= centerPnt.x;
            curvePt2.y -= centerPnt.y;
            curvePt.x -= centerPnt.x;
            curvePt.y -= centerPnt.y;
            var dist1 = Math.atan2(curvePt1.y, curvePt1.x)
            var dist2 = Math.atan2(curvePt2.y, curvePt2.x)
            var dist3 = Math.atan2(curvePt.y, curvePt.x);
            dist1 = dist1 < 0 ? 2 * Math.PI + dist1 : dist1;
            dist2 = dist2 < 0 ? 2 * Math.PI + dist2 : dist2;
            dist3 = dist3 < 0 ? 2 * Math.PI + dist3 : dist3;
            var dist4 = Math.min(dist1, dist2);
            var dist5 = Math.max(dist1, dist2);
            var dist6 = dist5 - dist4;
            if (dist3 < dist4 || dist3 > dist5) {
                dist6 -= (2 * Math.PI)
            }
            var dist7 = dist6 / n, point;
            for (var d = 0; d <= n; d++) {
                point = map.toMap({
                    x: radius * Math.cos(dist4 + d * dist7) + centerPnt.x,
                    y: radius * Math.sin(dist4 + d * dist7) + centerPnt.y
                });
                drawPoints.push(point)
            }
            var polyline = new Polyline(map.spatialReference);
            polyline.addPath(drawPoints);
            return polyline
        },
        //--------------------------------------------------------------------------------------------------------------

        //贝塞尔曲线-----------------------------------------------------------------------------------------------------
        CreateBezierPath: function(pnts, n, map) {
            var pnt = {
                x: pnts[0].x,
                y: pnts[0].y
            };
            if (pnts[pnts.length - 1].x === pnts[pnts.length - 2].x && pnts[pnts.length - 1].y === pnts[pnts.length - 2].y) {
                pnts.pop()
            }
            if (pnts[pnts.length - 1].x === pnts[pnts.length - 2].x && pnts[pnts.length - 1].y === pnts[pnts.length - 2].y) {
                pnts.pop()
            }
            var dist = TweenMax.to(pnt, n, {
                bezier: pnts,
                ease: Linear.easeNone
            });
            var drawPoints = [];
            for (var j = 0; j <= n; j++) {
                dist.time(j);
                drawPoints.push({
                    x: pnt.x,
                    y: pnt.y
                })
            }
            var polyline = new Polyline(map.spatialReference);
            polyline.addPath(drawPoints);
            return polyline
        },
        CreateBezierPathPoly: function(pnts, n, map) {
            var pnt = {
                x: pnts[0].x,
                y: pnts[0].y
            };
            if (pnts[pnts.length - 1].x === pnts[pnts.length - 2].x && pnts[pnts.length - 1].y === pnts[pnts.length - 2].y) {
                pnts.pop()
            }
            if (pnts[pnts.length - 1].x === pnts[pnts.length - 2].x && pnts[pnts.length - 1].y === pnts[pnts.length - 2].y) {
                pnts.pop()
            }
            pnts.push(pnts[0]);
            var dist = TweenMax.to(pnt, n, {
                bezier: pnts,
                ease: Linear.easeNone
            });
            var drawPoints = [];
            for (var j = 0; j <= n; j++) {
                dist.time(j);
                drawPoints.push({
                    x: pnt.x,
                    y: pnt.y
                })
            }
            var polygon = new Polygon(map.spatialReference);
            polygon.addRing(drawPoints);
            return polygon
        },
        CreateBezierPathPCOnly: function(pnts, n) {
            var pnt = {
                x: pnts[0].x,
                y: pnts[0].y
            };
            if (pnts[pnts.length - 1].x === pnts[pnts.length - 2].x && pnts[pnts.length - 1].y === pnts[pnts.length - 2].y) {
                pnts.pop()
            }
            if (pnts[pnts.length - 1].x === pnts[pnts.length - 2].x && pnts[pnts.length - 1].y === pnts[pnts.length - 2].y) {
                pnts.pop()
            }
            var dist = TweenMax.to(pnt, n, {
                bezier: pnts,
                ease: Linear.easeNone
            });
            var drawPoints = [];
            for (var j = 0; j <= n; j++) {
                dist.time(j);
                drawPoints.push({
                    x: pnt.x,
                    y: pnt.y
                })
            }
            return drawPoints;
        },
        CreateArrowHeadPathEx: function(pnt1, pnt2, pnt3, pntsLen, hPercentage, n) {
            var k1 = 1.7;
            var k2 = pntsLen * hPercentage;
            var k3 = k2 * k1;
            var angle1 = this.twoPtsAngle(pnt2, pnt1);
            var angle2 = this.twoPtsAngle(pnt2, pnt3);
            var dist = (Math.abs(angle1 - angle2)) / 2;
            if (Math.abs(angle1 - angle2) > Math.PI * 1.88) {
                dist += Math.PI
            }
            var k4 = Math.sqrt(k2 * k2 + k3 * k3 - 2 * k3 * k2 * Math.cos(dist + n / 180 * Math.PI));
            var k5 = Math.asin(k2 * Math.sin(dist + n / 180 * Math.PI) / k4);
            var k6 = k5 + n / 180 * Math.PI;
            var k7 = k2 * Math.sin(Math.PI - k6 - dist) / Math.sin(k6);
            var pnts = [];
            pnts.push({
                x: pnt2.x + k7 * Math.cos(angle1),
                y: pnt2.y + k7 * Math.sin(angle1)
            });
            pnts.push({
                x: pnt2.x + k3 * Math.cos(angle1 - n / 180 * Math.PI),
                y: pnt2.y + k3 * Math.sin(angle1 - n / 180 * Math.PI)
            });
            pnts.push(pnt2);
            pnts.push({
                x: pnt2.x + k3 * Math.cos(angle2 + n / 180 * Math.PI),
                y: pnt2.y + k3 * Math.sin(angle2 + n / 180 * Math.PI)
            });
            pnts.push({
                x: pnt2.x + k7 * Math.cos(angle2),
                y: pnt2.y + k7 * Math.sin(angle2)
            });
            return pnts;
        },
        twoPtsAngle: function(pnt1, pnt2) {
            var pntsAngle = Math.acos((pnt2.x - pnt1.x) / this._2PtLen(pnt1, pnt2));
            if (pnt2.y < pnt1.y) {
                pntsAngle = 2 * Math.PI - pntsAngle
            }
            return pntsAngle
        },
        //--------------------------------------------------------------------------------------------------------------

        //自定义函数-----------------------------------------------------------------------------------------------------
        _2PtLen: function(pnt1, pnt2) {
            return Math.sqrt((pnt1.x - pnt2.x) * (pnt1.x - pnt2.x) + (pnt1.y - pnt2.y) * (pnt1.y - pnt2.y))
        },
        twoPtsRelationShip: function(pnt1, pnt2) {
            if (pnt2.x > pnt1.x && pnt2.y >= pnt1.y) {
                return "ne"
            } else {
                if (pnt2.x <= pnt1.x && pnt2.y > pnt1.y) {
                    return "nw"
                } else {
                    if (pnt2.x < pnt1.x && pnt2.y <= pnt1.y) {
                        return "sw"
                    } else {
                        return "se"
                    }
                }
            }
        },
        vertexAngle: function(pnts) {
            var pnts1 = [], pnts2 = [],ptsAngle;
            for (var j = 0; j < pnts.length - 1; j++) {
                ptsAngle = this.twoPtsAngle(pnts[j], pnts[j + 1]);
                pnts1.push(ptsAngle)
            }
            ptsAngle = this.twoPtsAngle(pnts[0], pnts[1]);
            pnts2.push(ptsAngle += Math.PI / 2);
            for (j = 1; j < pnts.length - 1; j++) {
                ptsAngle = (pnts1[j - 1] + pnts1[j]) / 2;
                if (pnts1[j - 1] < Math.PI && pnts1[j] - Math.PI > pnts1[j - 1]) {
                    ptsAngle += Math.PI
                } else {
                    if (pnts1[j - 1] > Math.PI && pnts1[j] < pnts1[j - 1] - Math.PI) {
                        ptsAngle += Math.PI
                    }
                }
                ptsAngle += Math.PI / 2;
                pnts2.push(ptsAngle)
            }
            return pnts2
        },
        pntsCollectionLen: function(pnts, n) {
            var pntsLen = 0;
            for (var i = n; i < pnts.length - 1; i++) {
                pntsLen += this._2PtLen(pnts[i], pnts[i + 1])
            }
            return pntsLen;
        },
        toPolygon: function(n, pntx, pnty) {
            var polygon = new Polygon(this.map.spatialReference);
            polygon.addRing(array.map(n, lang.hitch(this,function(n) {
                return this.map.toMap({
                    x: n[0] + pntx,
                    y: n[1] + pnty
                })
            })));
            return polygon;
        },
        normalizeRect: function(xPoint, yPoint, spatialReference) {
            var xPointx = xPoint.x;
            var xPointy = xPoint.y;
            var yPointx = yPoint.x;
            var yPointy = yPoint.y;
            var width = Math.abs(xPointx - yPointx), height = Math.abs(xPointy - yPointy);
            return {
                x: Math.min(xPointx, yPointx),
                y: Math.max(xPointy, yPointy),
                width: width,
                height: height,
                spatialReference: spatialReference
            }
        },
        addShape: function(pnts, pntX, pntY) {
            var graphics = this.map.graphics.add(new Graphic(this.toPolygon(pnts, pntX, pntY),this.fillSymbol), true);
            this.setTooltipMessage(0);
            var shaps;
            graphics && (shaps = esriGeoJsonUtils.fromJson(graphics.geometry.toJson()),
                this.map.graphics.remove(graphics, true));
            this.drawEnd(shaps);
        },
        drawEnd: function(geometry) {
            if (geometry) {
                var geographicGeometry;
                this.onDrawEnd(geometry);
                if(this.map.spatialReference){
                    if(this.map.spatialReference.isWebMercator()){
                        geographicGeometry = webMercatorUtils.webMercatorToGeographic(geometry, true);
                    }else if(this.map.spatialReference.wkid === 4326){
                        geographicGeometry = esriGeoJsonUtils.fromJson(geometry.toJson());
                    }
                }
                this.onDrawComplete({
                    geometry: geometry,
                    _geographicGeometry: geographicGeometry
                })
            }
        },
        canDrawFreehandPoint: function(evt) {
            if (!this.screenPoint) {
                return false
            }
            var disX = this.screenPoint.x - evt.screenPoint.x
                , disY = this.screenPoint.y - evt.screenPoint.y
                , tolerance = this.drawOptions.tolerance;
            if ((0 > disX ? -1 * disX : disX) < tolerance && (0 > disY ? -1 * disY : disY) < tolerance) {
                return false
            }
            var drawDate = new Date;
            if (drawDate - this.startTime < this.drawOptions.drawTime) {
                return false
            }
            this.startTime = drawDate;
            this.screenPoint = evt.screenPoint;
            return true;
        },
        controlPointsUpdates: function(geometryType, graphic, pnts) {
            switch (geometryType) {
                case clazz.BEZIER_POLYGON:
                    var drawPoints = [];
                    array.forEach(pnts, function(point) {
                        drawPoints.push({
                            x: point.x,
                            y: point.y
                        })
                    });
                    graphic.geometry = this.CreateBezierPathPoly(drawPoints, 130, this.map);
                    graphic.setGeometry(graphic.geometry);
                    break;
                case clazz.BEZIER_CURVE:
                    var drawPoints = [];
                    array.forEach(pnts, function(point) {
                        drawPoints.push({
                            x: point.x,
                            y: point.y
                        })
                    });
                    graphic.geometry = this.CreateBezierPath(drawPoints, 100, this.map);
                    graphic.setGeometry(graphic.geometry);
                    break;
                case clazz.CURVE:
                    var circleDraw = this.circleDrawEx(this.map.toScreen(pnts[0]), this.map.toScreen(pnts[1]), this.map.toScreen(pnts[2]));
                    if (circleDraw.radius > 0) {
                        graphic.geometry = this.CreateCircleSegmentFromThreePoints(circleDraw, this.map.toScreen(pnts[0]), this.map.toScreen(pnts[1]), this.map.toScreen(pnts[2]), 60, this.map);
                        graphic.setGeometry(graphic.geometry)
                    }
                    break;
                case clazz.FREEHAND_ARROW:
                    var drawPoints = []
                        , bezierPath1 = []
                        , bezierPath3 = [];
                    array.forEach(pnts, function(point) {
                        drawPoints.push({
                            x: point.x,
                            y: point.y
                        })
                    });
                    var vertAngle = this.vertexAngle(drawPoints), pntsLen1, pnt1, pnt2;
                    var pntsLen2 = this.pntsCollectionLen(drawPoints, 0);
                    for (var i = 0, s = drawPoints.length - 1; i < s; i++) {
                        pntsLen1 = this.pntsCollectionLen(drawPoints, i);
                        pntsLen1 += pntsLen2 / 2.4;
                        pnt1 = {
                            x: (this.tailFactor) * pntsLen1 * Math.cos(vertAngle[i]) + drawPoints[i].x,
                            y: (this.tailFactor) * pntsLen1 * Math.sin(vertAngle[i]) + drawPoints[i].y
                        };
                        pnt2 = {
                            x: -1 * (this.tailFactor) * pntsLen1 * Math.cos(vertAngle[i]) + drawPoints[i].x,
                            y: -1 * (this.tailFactor) * pntsLen1 * Math.sin(vertAngle[i]) + drawPoints[i].y
                        };
                        bezierPath1.push(pnt1);
                        bezierPath3.push(pnt2)
                    }
                    bezierPath1.push({
                        x: drawPoints[drawPoints.length - 1].x,
                        y: drawPoints[drawPoints.length - 1].y
                    });
                    bezierPath3.push({
                        x: drawPoints[drawPoints.length - 1].x,
                        y: drawPoints[drawPoints.length - 1].y
                    });
                    bezierPath1 = this.CreateBezierPathPCOnly(bezierPath1, 70);
                    bezierPath1.splice(Math.floor((1 - this.headPercentage) * 70), Number.MAX_VALUE);
                    bezierPath3 = this.CreateBezierPathPCOnly(bezierPath3, 70);
                    bezierPath3.splice(Math.floor((1 - this.headPercentage) * 70), Number.MAX_VALUE);
                    var arrowHeadPath = this.CreateArrowHeadPathEx(bezierPath1[bezierPath1.length - 1], {
                        x: drawPoints[drawPoints.length - 1].x,
                        y: drawPoints[drawPoints.length - 1].y
                    }, bezierPath3[bezierPath3.length - 1], this.pntsCollectionLen(drawPoints, 0), this.headPercentage, 15);
                    var ring = [];
                    ring = ring.concat(bezierPath1);
                    ring = ring.concat(arrowHeadPath);
                    ring = ring.concat(bezierPath3.reverse());
                    ring.push(ring[0]);
                    var polygon = new Polygon(this.map.spatialReference);
                    polygon.addRing(ring);
                    graphic.geometry = polygon;
                    graphic.setGeometry(graphic.geometry);
                    break;
                case clazz.DOUBLE_ARROW:
                case clazz.MULTI_ARROW:
                case clazz.CUSTOM_ARROW:
                case clazz.CUSTOM_TAILED_ARROW:
                case clazz.HALF_CIRCLE:
                case clazz.SIMPLE_ARROW:
                case clazz.TAILED_ARROW:
                case clazz.STRAIGHT_ARROW:
                    var drawerPoints = PlotDrawer.createDrawPoints(geometryType, pnts);
                    var polygon = new Polygon(this.map.spatialReference);
                    polygon.addRing(drawerPoints);
                    graphic.geometry = polygon;
                    graphic.setGeometry(graphic.geometry);
                    break;
                default:
                    break
            }
        },
        //--------------------------------------------------------------------------------------------------------------

    });
    lang.mixin(clazz, {
        POINT: "point",
        POINT_TEXT: "pointtext",
        MULTI_POINT: "multipoint",
        LINE: "line",
        EXTENT: "extent",
        POLYLINE: "polyline",
        POLYGON: "polygon",
        FREEHAND_POLYLINE: "freehandpolyline",
        FREEHAND_POLYGON: "freehandpolygon",
        ARROW: "arrow",
        LEFT_ARROW: "leftarrow",
        RIGHT_ARROW: "rightarrow",
        UP_ARROW: "uparrow",
        DOWN_ARROW: "downarrow",
        TRIANGLE: "triangle",
        CIRCLE: "circle",
        ELLIPSE: "ellipse",
        RECTANGLE: "rectangle",
        CURVE: "curve",
        BEZIER_CURVE: "beziercurve",
        BEZIER_POLYGON: "bezierpolygon",
        FREEHAND_ARROW: "freehandarrow",
        POLYLINEEX: "polylineex",
        ASSEMBLY_AREA: "assemblyarea",
        HALF_CIRCLE: "halfcircle",
        TRIANGLE_FLAG: "triangleflag",
        RECT_FLAG: "rectflag",
        UMBRELLA_SHAPE: "umbrellashape",
        FAN_SHAPE: "fanshape",
        DOUBLE_ARROW: "doublearrow",
        MULTI_ARROW: "multiarrow",
        SIMPLE_ARROW: "simplearrow",
        CUSTOM_ARROW: "customarrow",
        TAILED_ARROW: "tailearrow",
        CUSTOM_TAILED_ARROW: "customtailedarrow",
        STRAIGHT_ARROW: "straightarrow"
    });
    has("extend-esri") && lang.setObject("toolbars.Draw", clazz, esriNS);//扩展接口
    return clazz
});
