define(["dojo/_base/declare","dojo/_base/lang","dojo/_base/array","dojo/_base/connect","dojo/has","dojo/dom-style",    "dojox/gfx/Moveable","dojox/gfx/matrix","esri/kernel","esri/lang","esri/geometry/Point","esri/geometry/Polyline",    "esri/geometry/webMercatorUtils","esri/geometry/jsonUtils","esri/graphic"],     function (declare, lang, array, connect, has, domStyle, Moveable, matrix, kernel, esriLang, Point, Polyline,               webMercatorUtils, jsonUtils, Graphic) {    var clazz = declare(null, {        declaredClass: "esri.toolbars._BoxEx",        graphic:null,        controlPoints:null,        drawExtendType:null,        map:null,        toolbar:null,        scale:null,        rotate:null,        defaultEventArgs:null,        scaleEvent:null,        rotateEvent:null,        uniformScaling:null,        lineSymbol:null,        boxGraphic:null,        anchors:null,        controlAnchors:null,        connectEvents:null,        centerCoord:null,        startLine:null,        moveLine:null,        firstMoverToCenter:null,        startBox:null,        xfactor:null,        yfactor:null,        mapControlPnt:null,        moveBox:null,                constructor: function (graphic, map, toolbar, scale, rotate, uniScaling) {            this.graphic = graphic;            if (graphic.geometry.controlPoints) {                this.controlPoints = graphic.geometry.controlPoints            }            if (graphic.geometry.drawExtendType) {                this.drawExtendType = graphic.geometry.drawExtendType            }            this.map = map;            this.toolbar = toolbar;            this.scale = scale;            this.rotate = rotate;            this.defaultEventArgs = {};            this.scaleEvent = "Scale";            this.rotateEvent = "Rotate";            this.uniformScaling = uniScaling;            this.markerSymbol = toolbar._options.boxHandleSymbol;            this.controlSymbol = toolbar._options.controlPointSymbol;            this.lineSymbol = toolbar._options.boxLineSymbol;            this.moveStartHandler = lang.hitch(this, this.moveStartHandler);            this.firstMoveHandler = lang.hitch(this, this.firstMoveHandler);            this.moveStopHandler = lang.hitch(this, this.moveStopHandler);            this.moveHandler = lang.hitch(this, this.moveHandler);            this.init();        },                init: function () {            this.draw()        },        draw: function () {            if (this.graphic.getDojoShape()) {                var map = this.map;                var scratchGL = this.toolbar.scratchGL;                var boxCoords = this.getBoxCoords();                var polyline = new Polyline(map.spatialReference);                var cloneCoords = lang.clone(array.filter(boxCoords,                     function (option, coord) {                        return 8 !== coord && 0 === coord % 2                    }));                cloneCoords[0] && cloneCoords.push([cloneCoords[0][0], cloneCoords[0][1]]);                polyline.addPath(cloneCoords);                this.rotate && polyline.addPath([boxCoords[1], boxCoords[8]]);                this.boxGraphic ? this.boxGraphic.setGeometry(polyline) :                     (this.boxGraphic = new Graphic(polyline, this.lineSymbol), scratchGL.add(this.boxGraphic));                if(this.anchors){                    array.forEach(this.anchors, function (graphics, option) {                        this.scale || (option = 8);                        var boxPnt = new Point(boxCoords[option], map.spatialReference);                        graphics.graphic.setGeometry(boxPnt);                        var dojoShape1 = graphics.moveable;                        var dojoShape2 = graphics.graphic.getDojoShape();                        if (dojoShape2) {                            if (dojoShape1) {                                if (dojoShape2 != dojoShape1.shape) {                                    dojoShape1.destroy();                                    graphics.moveable = this.getMoveable(graphics.graphic, option)                                }                            } else {                                graphics.moveable = this.getMoveable(graphics.graphic, option)                            }                        }                    }, this)                }else{                    this.anchors = [];                    this.connectEvents = [];                    array.forEach(boxCoords, function (coordPnt, option) {                        if (this.scale || (8 <= option)) {                            coordPnt = new Point(coordPnt, map.spatialReference);                            var graphic = new Graphic(coordPnt, this.markerSymbol);                            scratchGL.add(graphic);                            this.anchors.push({graphic: graphic, moveable: this.getMoveable(graphic, option)})                        }                    }, this);                }                if (this.controlPoints) {                    if (this.controlAnchors) {                        array.forEach(this.controlAnchors, function (controlAnchors, option) {                            var mapPnt = new Point(this.controlAnchors[option].graphic.geometry, map.spatialReference);                            controlAnchors.graphic.controlPoints = true;                            controlAnchors.graphic.setGeometry(mapPnt);                            var dojoShape = controlAnchors.moveable, moveAble = controlAnchors.graphic.getDojoShape();                            if (moveAble) {                                if (dojoShape) {                                    if (moveAble != dojoShape.shape) {                                        dojoShape.destroy();                                        controlAnchors.moveable = this.getMoveable(controlAnchors.graphic, option, true, option)                                    }                                } else {                                    controlAnchors.moveable = this.getMoveable(controlAnchors.graphic, option, true, option)                                }                            }                        }, this)                    } else {                        this.controlAnchors = [];                        this.connectEvents = [];                        array.forEach(this.controlPoints, function (controlPnt, option) {                            controlPnt = new Point(controlPnt, map.spatialReference);                            var graphic = new Graphic(controlPnt, this.controlSymbol);                            graphic.controlPoints = true;                            scratchGL.add(graphic);                            this.controlAnchors.push({graphic: graphic, moveable: this.getMoveable(graphic, option, true, option)})                        }, this)                    }                }            } else {                this.cleanUp()            }        },        cleanUp: function () {            this.connectEvents && array.forEach(this.connectEvents, connect.disconnect);            var scratchGL = this.toolbar.scratchGL;            this.anchors && array.forEach(this.anchors, function (anchor) {                scratchGL.remove(anchor.graphic);                (anchor = anchor.moveable) && anchor.destroy()            });            this.controlAnchors && array.forEach(this.controlAnchors, function (cpAnchor) {                scratchGL.remove(cpAnchor.graphic);                (cpAnchor = cpAnchor.moveable) && cpAnchor.destroy()            });            this.boxGraphic && scratchGL.remove(this.boxGraphic);            this.boxGraphic = this.anchors = this.connectEvents = this.controlAnchors = null;        },        getMoveable: function (graphic, index1, control, index2) {            var dojoShape = graphic.getDojoShape();            if (dojoShape) {                var moveAble = new Moveable(dojoShape);                moveAble._index = index1;                moveAble.controlPointIndex = index2;                moveAble._control = control;                this.connectEvents.push(connect.connect(moveAble, "onMoveStart", this.moveStartHandler));                this.connectEvents.push(connect.connect(moveAble, "onFirstMove", this.firstMoveHandler));                this.connectEvents.push(connect.connect(moveAble, "onMoveStop", this.moveStopHandler));                moveAble.onMove = this.moveHandler;                !control && (dojoShape = dojoShape.getEventSource()) && domStyle.set(dojoShape, "cursor", this.toolbar._cursors["box" + index1]);                control && (dojoShape = dojoShape.getEventSource()) && domStyle.set(dojoShape, "cursor", this.toolbar._cursors["move"]);                return moveAble;            }        },                moveStartHandler: function (evt) {            !this.controlPoints &&             this.toolbar["on" + (8 === evt.host._index ? this.rotateEvent : this.scaleEvent) + "Start"](this.graphic)        },        firstMoveHandler: function (evt) {            var hostIndex = evt.host._index, wrapOffset = this._wrapOffset = evt.host.shape._wrapOffsets[0] || 0,                transFrom = this.graphic.getLayer()._div.getTransform(), points;            var boxCoords = array.map(this.getBoxCoords(true), function (boxCoord) {                return {x: boxCoord[0] + wrapOffset, y: boxCoord[1]}            });            points = {x: boxCoords[1].x, y: boxCoords[3].y};            this.centerCoord = matrix.multiplyPoint(matrix.invert(transFrom), points);            if (8 === hostIndex) {                points = matrix.multiplyPoint(matrix.invert(transFrom), boxCoords[1]);                this.startLine = [this.centerCoord, points];                this.moveLine = lang.clone(this.startLine);            } else {                if (points = matrix.multiplyPoint(matrix.invert(transFrom), boxCoords[hostIndex]),                         transFrom = matrix.multiplyPoint(matrix.invert(transFrom), boxCoords[(hostIndex + 4) % 8]),                         this.firstMoverToCenter = Math.sqrt((points.x - this.centerCoord.x) * (points.x - this.centerCoord.x) + (points.y - this.centerCoord.y) * (points.y - this.centerCoord.y)),                         this.startBox = transFrom, this.startBox.width = boxCoords[4].x - boxCoords[0].x,                         this.startBox.height = boxCoords[4].y - boxCoords[0].y, this.moveBox = lang.clone(this.startBox),                         this.xfactor = points.x > transFrom.x ? 1 : -1, this.yfactor = points.y > transFrom.y ? 1 : -1,                     1 === hostIndex || 5 === hostIndex) {                    this.xfactor = 0                } else if (3 === hostIndex || 7 === hostIndex) {                    this.yfactor = 0;                }            }            this.toolbar.beginOperation("BOX");            !this.controlPoints && this.toolbar["on" + (8 === hostIndex ? this.rotateEvent : this.scaleEvent) + "FirstMove"](this.graphic);            if (this.controlPoints) {                this.mapControlPnt = [];                array.forEach(this.controlPoints, function (controlPoint, option) {                    this.mapControlPnt.push(this.map.toScreen(controlPoint))                }, this)            }        },        moveStopHandler: function (evt) {            if (!evt.host._control) {                var graphic = this.graphic;                var toolbar = this.toolbar;                var toolbarGeo = toolbar._geo ? webMercatorUtils.geographicToWebMercator(graphic.geometry) : graphic.geometry;                var geoSpatialRef = toolbarGeo.spatialReference;                var dojoShape = graphic.getDojoShape();                var dojoShapeT = dojoShape.getTransform();                var graphicT = graphic.getLayer()._div.getTransform();                var toolbarJson = toolbarGeo.toJson();                this.controlPoints && array.forEach(this.controlAnchors, function (controlAnchor, n) {                    this.updateControlPoints(controlAnchor, n)                }, this);                this.updateSegments(toolbarJson.paths || toolbarJson.rings, dojoShapeT, graphicT, geoSpatialRef);                dojoShape.setTransform(null);                var toolGeoJson = jsonUtils.fromJson(toolbarJson);                graphic.setGeometry(toolbar._geo ? webMercatorUtils.webMercatorToGeographic(toolGeoJson, true) : toolGeoJson);                graphic.geometry.controlPoints = this.controlPoints;                graphic.geometry.drawExtendType = this.drawExtendType;                this.startLine = this.moveLine = this.startBox = this.moveBox = this.xfactor = this.yfactor = null;                toolbar.endOperation("BOX");                this.draw();                array.forEach(this.anchors, function (anchor) {                    anchor.graphic.getDojoShape().moveToFront()                });                array.forEach(this.controlAnchors, function (controlAnchor) {                    controlAnchor.graphic.getDojoShape().moveToFront()                });                if (this.graphic.geometry.type === "polyline") {                    this.toolbar.enableMoveHandler(this.graphic)                }                this.defaultEventArgs.transform = dojoShapeT;                toolbar["on" + (8 === evt.host._index ? this.rotateEvent : this.scaleEvent) + "Stop"](this.graphic, this.defaultEventArgs)            } else {                this.graphic.geometry.controlPoints = this.controlPoints;                this.graphic.geometry.drawExtendType = this.drawExtendType;                this.draw();                array.forEach(this.anchors, function (a) {                    a.graphic.getDojoShape().moveToFront()                });                array.forEach(this.controlAnchors, function (a) {                    a.graphic.getDojoShape().moveToFront()                });                if (this.graphic.geometry.type === "polyline") {                    this.toolbar.enableMoveHandler(this.graphic)                }            }        },        moveHandler: function (evt, option) {            var hostIndex = evt.host._index, defaultArgs = this.defaultEventArgs, startBox, moveBox, scaleX, scaleY,                 offsetX = 0, offsetY = 0;            defaultArgs.angle = 0;            defaultArgs.scaleX = 1;            defaultArgs.scaleY = 1;            if (8 === hostIndex && !evt.host._control) {                var startLine = this.startLine;                var moveLine = this.moveLine;                var moveLine1 = moveLine[1];                moveLine1.x += option.dx;                moveLine1.y += option.dy;                var angle = this.getAngle(startLine, moveLine);                var rotateg = matrix.rotategAt(angle, startLine[0]);                this.graphic.getDojoShape().setTransform(rotateg);                defaultArgs.transform = rotateg;                defaultArgs.angle = angle;                defaultArgs.around = startLine[0]            } else {                if (!evt.host._control) {                    startBox = this.startBox;                    moveBox = this.moveBox;                    moveBox.width += option.dx * this.xfactor;                    moveBox.height += option.dy * this.yfactor;                    if(this.uniformScaling){                        scaleX = moveBox.x + this.xfactor * moveBox.width;                        moveBox = moveBox.y + this.yfactor * moveBox.height;                        moveBox = Math.sqrt((scaleX - this.centerCoord.x) * (scaleX - this.centerCoord.x) + (moveBox - this.centerCoord.y) * (moveBox - this.centerCoord.y));                        scaleX = scaleY = moveBox / this.firstMoverToCenter;                        offsetX = this.xfactor * startBox.width / 2;                        offsetY = this.yfactor * startBox.height / 2;                    }else{                        scaleX = moveBox.width / startBox.width;                        scaleY = moveBox.height / startBox.height;                    }                    if (isNaN(scaleX) || Infinity === scaleX || -Infinity === scaleX) {                        scaleX = 1                    }                    if (isNaN(scaleY) || Infinity === scaleY || -Infinity === scaleY) {                        scaleY = 1                    }                    moveBox = matrix.scaleAt(scaleX, scaleY, startBox.x + offsetX, startBox.y + offsetY);                    this.graphic.getDojoShape().setTransform(moveBox);                    defaultArgs.transform = moveBox;                    defaultArgs.scaleX = scaleX;                    defaultArgs.scaleY = scaleY;                    defaultArgs.around = {x: startBox.x + offsetX, y: startBox.y + offsetY}                } else {                    var pntIndex = evt.host.controlPointIndex;                    this.mapControlPnt[pntIndex].x += option.dx;                    this.mapControlPnt[pntIndex].y += option.dy;                    this.controlPoints[pntIndex] = this.map.toMap(this.mapControlPnt[pntIndex]);                    this.toolbar._draw.controlPointsUpdates(this.drawExtendType, this.graphic, this.controlPoints);                    array.forEach(this.controlAnchors, function (controlAnchors, f) {                        if (f === pntIndex) {                            var mapPnt = new Point(this.controlPoints[pntIndex], this.map.spatialReference);                            controlAnchors.graphic.controlPoints = !0;                            controlAnchors.graphic.setGeometry(mapPnt);                            controlAnchors.graphic.getDojoShape().moveToFront()                        } else {                            controlAnchors.graphic.getDojoShape().moveToFront()                        }                    }, this);                    this.graphic.geometry.controlPoints = this.controlPoints                }            }            !this.controlPoints && this.toolbar["on" + (8 === hostIndex ? this.rotateEvent : this.scaleEvent)](this.graphic, defaultArgs)        },        updateControlPoints: function (cpAnchor, n) {            var graphic = this.graphic;            var toolbar = this.toolbar;            var toolbarGeo = toolbar._geo ? webMercatorUtils.geographicToWebMercator(cpAnchor.graphic.geometry) : cpAnchor.graphic.geometry;            var toolbarSpatialRef = toolbarGeo.spatialReference;            var dojoShape = graphic.getDojoShape();            var dojoShapeT = dojoShape.getTransform();            var Q = graphic.getLayer()._div.getTransform();            var map = this.map, wrapOffset = this._wrapOffset || 0;            var maPnt = map.toScreen({x: toolbarGeo.x, y: toolbarGeo.y, spatialReference: toolbarSpatialRef}, !0);            maPnt.x += wrapOffset;            maPnt = matrix.multiplyPoint([Q, dojoShapeT, matrix.invert(Q)], maPnt);            maPnt.x -= wrapOffset;            maPnt = map.toMap(maPnt);            cpAnchor.graphic.geometry.x = maPnt.x;            cpAnchor.graphic.geometry.y = maPnt.y;            this.controlPoints[n].x = maPnt.x;            this.controlPoints[n].y = maPnt.y        },        updateSegments: function (paths, dojoShapeT, graphicT, geoSpatialRef) {            var map = this.map, offSet = this._wrapOffset || 0;            array.forEach(paths, function (path) {                array.forEach(path, function (pathPnt) {                    var mapPnt = map.toScreen({x: pathPnt[0], y: pathPnt[1], spatialReference: geoSpatialRef}, true);                    mapPnt.x += offSet;                    mapPnt = matrix.multiplyPoint([graphicT, dojoShapeT, matrix.invert(graphicT)], mapPnt);                    mapPnt.x -= offSet;                    mapPnt = map.toMap(mapPnt);                    pathPnt[0] = mapPnt.x;                    pathPnt[1] = mapPnt.y                })            })        },        getAngle: function (startLine, moveLine) {            var S = 180 * Math.atan2(startLine[0].y - startLine[1].y, startLine[0].x - startLine[1].x) / Math.PI;            return 180 * Math.atan2(moveLine[0].y - moveLine[1].y, moveLine[0].x - moveLine[1].x) / Math.PI - S        },        destroy: function () {            this.cleanUp();            this.graphic = this.map = this.toolbar = this.markerSymbol = this.lineSymbol = null        },        refresh: function () {            this.draw()        },        suspend: function () {            array.forEach(this.getAllGraphics(), function (graphic) {                graphic.hide()            })        },         resume: function () {            array.forEach(this.getAllGraphics(), function (graphic) {                graphic.show()            });            this.draw()        },        getAllGraphics: function () {            var mapPnts = [];            this.controlAnchors && array.forEach(this.controlAnchors, function (controlAnchor) {                mapPnts.push(controlAnchor.graphic)            });            this.anchors && array.forEach(this.anchors, function (anchor) {                mapPnts.push(anchor.graphic)            });            mapPnts.push(this.boxGraphic);            return mapPnts = array.filter(mapPnts, esriLang.isDefined)        },        getBoxCoords: function (option) {            var map = this.map, boundBox = this.getTransformedBoundingBox(this.graphic), boxCoords = [], boxPnt, N1, N2;            array.forEach(boundBox, function (bBoxPnt, N3, N4) {                boxPnt = bBoxPnt;                (N1 = N4[N3 + 1]) || (N1 = N4[0]);                N2 = {x: (boxPnt.x + N1.x) / 2, y: (boxPnt.y + N1.y) / 2};                option || (boxPnt = map.toMap(boxPnt), N2 = map.toMap(N2));                boxCoords.push([boxPnt.x, boxPnt.y]);                boxCoords.push([N2.x, N2.y])            });            if(this.rotate){                boundBox = lang.clone(boxCoords[1]);                boundBox = option ? {x: boundBox[0], y: boundBox[1]} :                    map.toScreen({x: boundBox[0],y: boundBox[1],spatialReference: map.spatialReference});                boundBox.y -= this.toolbar._options.rotateHandleOffset;                option || (boundBox = map.toMap(boundBox));                boxCoords.push([boundBox.x, boundBox.y]);            };            return boxCoords        },        getTransformedBoundingBox: function (graphic) {            var map = this.map, geoExtent = graphic.geometry.getExtent(), geoSpatialRef = graphic.geometry.spatialReference;            var geoPnt1 = new Point(geoExtent.xmin, geoExtent.ymax, geoSpatialRef);            var geoPnt2 = new Point(geoExtent.xmax, geoExtent.ymin, geoSpatialRef);            geoPnt1 = map.toScreen(geoPnt1);            geoPnt2 = map.toScreen(geoPnt2);            return [{x: geoPnt1.x, y: geoPnt1.y}, {x: geoPnt2.x, y: geoPnt1.y}, {x: geoPnt2.x, y: geoPnt2.y}, {x: geoPnt1.x, y: geoPnt2.y}]        }    });    has("extend-esri") && lang.setObject("toolbars._BoxEx", clazz, kernel);    return clazz});