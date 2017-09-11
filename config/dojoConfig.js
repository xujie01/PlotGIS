var pathRegex = new RegExp(/\/[^\/]+$/);/*匹配最后一个/到最后*/
var locationPath = location.pathname.replace(pathRegex, '');
var dojoConfig = {
    async:true,
    paths:{
        app:locationPath+"/scripts" ,
        config:locationPath + "/config",
        libs:locationPath+"/libs"
    }
};