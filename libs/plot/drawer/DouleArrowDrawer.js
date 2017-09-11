define(["dojo/_base/declare", "dojo/_base/lang","./PlotUtil"],    function (declare, lang, PlotUtilPlotUtil) {    var clazz = declare([], {        //双箭头        constructor: function (opitons) {            if (this.id == null) {                this.id = "DouleArrowDrawer"            }        },        plotState: "drawing",        connPoint: null,        tempPoint4: null,        headHeightFactor: 0.2,        headWidthFactor: 0.4,        neckHeightFactor: 0.75,        neckWidthFactor: 0.15,        getPoints: function (points) {            var point0 = null;            var point1 = null;            var point2 = null;            var arrowPoints1 = null;            var arrowPoints2 = null;            var arrowPntsLen = 0;            var arrowPntsLen1 = 0;            var bPoints1 = null;            var arrowPoints3 = null;            var arrowPoints4 = null;            var arrowPoints5 = null;            var arrowPoints6 = null;            var arrowPoints7 = null;            var bPoints2 = null;            //var W = null;            var pointsLen = points.length;            if (pointsLen >= 3 && points[(pointsLen - 1)] != points[pointsLen - 2]) {                point0 = points[0];                point1 = points[1];                point2 = points[2];                if (pointsLen == 3) {                    this.tempPoint4 = this.getTempPnt4(point0, point1, point2)                } else {                    this.tempPoint4 = points[3]                }                if (this.plotState == "drawing") {                    this.connPoint = PlotUtilPlotUtil.getMidPoint(point0, point1)                }                arrowPoints1 = this.getArrowPoints(point0, this.connPoint, this.tempPoint4, PlotUtilPlotUtil.LEFT_SIDE);                arrowPoints2 = this.getArrowPoints(this.connPoint, point1, point2, PlotUtilPlotUtil.RIGHT_SIDE);                arrowPntsLen = arrowPoints1.length;                arrowPntsLen1 = (arrowPntsLen - 5) / 2;                bPoints1 = arrowPoints1.slice(0, arrowPntsLen1);                arrowPoints3 = arrowPoints1.slice(arrowPntsLen1, arrowPntsLen1 + 5);                arrowPoints4 = arrowPoints1.slice(arrowPntsLen1 + 5, arrowPntsLen);                arrowPoints5 = arrowPoints2.slice(0, arrowPntsLen1);                arrowPoints6 = arrowPoints2.slice(arrowPntsLen1, arrowPntsLen1 + 5);                arrowPoints7 = arrowPoints2.slice(arrowPntsLen1 + 5, arrowPntsLen);                bPoints1 = PlotUtilPlotUtil.getBezierPoints(bPoints1);                bPoints2 = PlotUtilPlotUtil.getBezierPoints(arrowPoints4.concat(arrowPoints5));                arrowPoints7 = PlotUtilPlotUtil.getBezierPoints(arrowPoints7);                return bPoints1.concat(arrowPoints3, bPoints2, arrowPoints6, arrowPoints7)            }            return null        },        getTempPnt4: function (pnt1, pnt2, pnt3) {            var thirdPnt1 = null;            var N1 = NaN;            var N2 = NaN;            var thirdPnt2 = null;            var midPnt = PlotUtilPlotUtil.getMidPoint(pnt1, pnt2);            var disPnts = PlotUtilPlotUtil.distance(midPnt, pnt3);            var angleThreePnts = PlotUtilPlotUtil.getAngleOfThreePoints(pnt1, midPnt, pnt3);            if (PlotUtilPlotUtil.getAngleOfThreePoints(pnt1, midPnt, pnt3) < Math.PI / 2) {                N1 = disPnts * Math.sin(angleThreePnts);                N2 = disPnts * Math.cos(angleThreePnts);                thirdPnt2 = PlotUtilPlotUtil.getThirdPoint(pnt1, midPnt, Math.PI * 1.5, N1, PlotUtilPlotUtil.LEFT_SIDE);                thirdPnt1 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt2, Math.PI * 1.5, N2, PlotUtilPlotUtil.RIGHT_SIDE)            } else {                if (angleThreePnts >= Math.PI / 2 && angleThreePnts < Math.PI) {                    N1 = disPnts * Math.sin(Math.PI - angleThreePnts);                    N2 = disPnts * Math.cos(Math.PI - angleThreePnts);                    thirdPnt2 = PlotUtilPlotUtil.getThirdPoint(pnt1, midPnt, Math.PI * 1.5, N1, PlotUtilPlotUtil.LEFT_SIDE);                    thirdPnt1 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt2, Math.PI * 1.5, N2, PlotUtilPlotUtil.LEFT_SIDE)                } else {                    if (angleThreePnts >= Math.PI && angleThreePnts < Math.PI * 1.5) {                        N1 = disPnts * Math.sin(angleThreePnts - Math.PI);                        N2 = disPnts * Math.cos(angleThreePnts - Math.PI);                        thirdPnt2 = PlotUtilPlotUtil.getThirdPoint(pnt1, midPnt, Math.PI * 1.5, N1, PlotUtilPlotUtil.RIGHT_SIDE);                        thirdPnt1 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt2, Math.PI * 1.5, N2, PlotUtilPlotUtil.RIGHT_SIDE)                    } else {                        N1 = disPnts * Math.sin(Math.PI * 2 - angleThreePnts);                        N2 = disPnts * Math.cos(Math.PI * 2 - angleThreePnts);                        thirdPnt2 = PlotUtilPlotUtil.getThirdPoint(pnt1, midPnt, Math.PI * 1.5, N1, PlotUtilPlotUtil.RIGHT_SIDE);                        thirdPnt1 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt2, Math.PI * 1.5, N2, PlotUtilPlotUtil.LEFT_SIDE)                    }                }            }            return thirdPnt1        },        getArrowPoints: function (pnt1, pnt2, pnt3, N) {            var midPnt = PlotUtilPlotUtil.getMidPoint(pnt1, pnt2);            var mdisPnts = PlotUtilPlotUtil.distance(midPnt, pnt3);            var thirdPnt1 = PlotUtilPlotUtil.getThirdPoint(pnt3, midPnt, 0, mdisPnts * 0.3, PlotUtilPlotUtil.LEFT_SIDE);            var thirdPnt2 = PlotUtilPlotUtil.getThirdPoint(pnt3, midPnt, 0, mdisPnts * 0.5, PlotUtilPlotUtil.LEFT_SIDE);            var thirdPnt3 = PlotUtilPlotUtil.getThirdPoint(pnt3, midPnt, 0, mdisPnts * 0.7, PlotUtilPlotUtil.LEFT_SIDE);            thirdPnt1 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt1, Math.PI * 1.5, mdisPnts / 4, N);            thirdPnt2 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt2, Math.PI * 1.5, mdisPnts / 4, N);            thirdPnt3 = PlotUtilPlotUtil.getThirdPoint(midPnt, thirdPnt3, Math.PI * 1.5, mdisPnts / 4, N);            var pnts = [midPnt, thirdPnt1, thirdPnt2, thirdPnt3, pnt3];            var headPnts1 = PlotUtilPlotUtil.getArrowHeadPoints(pnts, this.headHeightFactor, this.headWidthFactor, this.neckHeightFactor, this.neckWidthFactor);            var headPnts2 = PlotUtilPlotUtil.getArrowHeadPoints(pnts, this.headHeightFactor, this.headWidthFactor, this.neckHeightFactor, this.neckWidthFactor)[0];            var headPnt4 = headPnts1[4];            var disPnts1 = PlotUtilPlotUtil.distance(pnt1, pnt2) / PlotUtilPlotUtil.getBaseLength(pnts) / 2;            var N1 = N == PlotUtilPlotUtil.LEFTSIDE ? (1) : (0.01);            var N2 = N == PlotUtilPlotUtil.LEFTSIDE ? (0.01) : (1);            var bodyPnts1 = PlotUtilPlotUtil.getArrowBodyPoints(pnts, headPnts2, headPnt4, disPnts1, N1, N2);            var bodyPnts2 = PlotUtilPlotUtil.getArrowBodyPoints(pnts, headPnts2, headPnt4, disPnts1, N1, N2).length;            var bodyPnts3 = bodyPnts1.slice(0, bodyPnts2 / 2);            var tempPoints = bodyPnts1.slice(bodyPnts2 / 2, bodyPnts2);            bodyPnts3.push(headPnts2);            tempPoints.push(headPnt4);            bodyPnts3 = bodyPnts3.reverse();            bodyPnts3.push(pnt1);            tempPoints = tempPoints.reverse();            tempPoints.push(pnt2);            return bodyPnts3.reverse().concat(headPnts1, tempPoints)        }    });    return clazz});