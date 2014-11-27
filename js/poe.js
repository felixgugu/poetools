$(function () {

    $("#Submit").click(function () {

        $(".poeDiv").html("");
        var body = $("body");

        //天賦分析
        var t = $("#poePoint").val();

        if (t.indexOf("/") != -1) {
            t = t.substring(t.lastIndexOf("/") + 1, t.length);
        }

        t = t.replace(/-/g, "+").replace(/_/g, "/");
        t = new base64().decode(t);

        var s = new ByteDecoder();
        s.setDataString("" + t);
        var o = s.readInt(), u = s.readInt8(), a = 0;
        o > 0 && (a = s.readInt8());

        //u 是角色
        var characterData = passiveSkillTreeData.characterData[u];
        var baseSkills = [];
        baseSkills.push("+" + characterData.base_str + " 力量");
        baseSkills.push("+" + characterData.base_dex + " 敏捷");
        baseSkills.push("+" + characterData.base_int + " 智慧");

        var poeLevel = parseInt($("#poeLevel").val()) - 1;


        //起始 +50 最大生命, 每級 +12 最大生命
        //起始 +40 最大魔力, 每級 +4 最大魔力
        //起始 +50 點閃避值, 每級 +3 點閃避值
        //每級 +2 點命中值         

        baseSkills.push("+" + (50 + (poeLevel * 12)) + " 最大生命");
        baseSkills.push("+" + (40 + (poeLevel * 4)) + " 最大魔力");
        baseSkills.push("+" + (50 + (poeLevel * 3)) + " 點閃避值");
        baseSkills.push("+" + (0 + (poeLevel * 2)) + " 點命中值");


        var f = [];//已點技能ID
        while (s.hasData()) {
            f.push(s.readInt16());
        }

        var allSkillMap = new Map();//收集所有技能點
        for (var i = 0; i < passiveSkillTreeData.nodes.length; i++) {
            var n = passiveSkillTreeData.nodes[i];
            allSkillMap.put(n.id, n);
        }

        var innateSkills = [];
        for (var i = 0; i < f.length; i++) {
            var n = allSkillMap.get(f[i]);
            for (var j = 0; j < n.sd.length; j++) {
                innateSkills.push(n.sd[j]);
            }
        }


        var equipmentSkills = [];
        //裝備分析
        $.ajax({
            url: $("#poeItem").val(),
            async: false,
            dataType: 'text',
            success: function (htmldata) {


                var lines = htmldata.split("\n");
                var data = null;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].indexOf("PoE/Item/DeferredItemRenderer") != -1) {
                        var itemLine = ""+$.trim(lines[i]);
                        itemLine = itemLine.substring(65,itemLine.length);
                        itemLine = itemLine.substring(0,itemLine.length-14);
                        htmldata = $.parseJSON("{\"items\":["+itemLine+"]}");
                    }
                }

                

                if (htmldata) {
                    for (var i = 0; i < htmldata.items.length; i++) {

                        var item = htmldata.items[i][1];


                        /*                      if (item.inventoryId == 'Offhand2'
                         || item.inventoryId == 'Flask'
                         || item.inventoryId == 'MainInventory'
                         || item.inventoryId == 'Weapon2'
                         || !(item.x == 0 && item.y == 0)) {
                         continue;
                         }*/

                        var implicitMods = item.implicitMods;
                        if (implicitMods) {
                            for (var j = 0; j < implicitMods.length; j++) {
                                equipmentSkills.push(implicitMods[j]);
                            }
                        }

                        var explicitMods = item.explicitMods;
                        if (explicitMods) {
                            for (var j = 0; j < explicitMods.length; j++) {
                                equipmentSkills.push(explicitMods[j]);
                            }
                        }

                        //基底屬性
                        var properties = item.properties;
                        if (properties) {
                            for (var j = 0; j < properties.length; j++) {

                                var nval = "";
                                if ("閃避值" == properties[j].name) {
                                    nval = "+" + properties[j].values[0][0] + " 點閃避值";
                                } else if ("能量護盾" == properties[j].name) {
                                    nval = "+" + properties[j].values[0][0] + " 最大能量護盾";
                                } else if ("護甲" == properties[j].name) {
                                    nval = "+" + properties[j].values[0][0] + " 護甲";
                                } else if ("格擋機率" == properties[j].name) {
                                    nval = "增加 " + properties[j].values[0][0] + " 格擋機率";
                                } else {
                                    continue;
                                }
                                equipmentSkills.push(nval);
                            }
                        }
                    }
                }
            }
        });

        var skills = innateSkills.concat(equipmentSkills).concat(baseSkills);
        skills.sort();


        var skillDatas = [skills, innateSkills, equipmentSkills, baseSkills];


        //合併計算
        var reg1 = / [+0-9\.%]* /;
        var reg2 = /^[\-+0-9\.%]* /;

        for (var k = 0; k < skillDatas.length; k++) {

            var skillList = skillDatas[k];

            var others = [];//其它技能點(無數值，獨特，不用計算)
            var sumMap = new Map();
            for (var i = 0; i < skillList.length; i++) {

                //有5個數字，不用列入加總
                var test = skillList[i].match(/[0-9%]/g);
                if (test != undefined && test.length >= 5) {
                    others.push(skillList[i]);
                    continue;
                }

                var val = skillList[i].match(reg1);
                if (val) {
                    var name = skillList[i].replace(reg1, ' N ');
                    maphandle(sumMap, name, val);

                } else {
                    val = skillList[i].match(reg2);
                    if (val) {
                        var name = skillList[i].replace(reg2, 'N ');
                        maphandle(sumMap, name, val);
                    } else {
                        others.push(skillList[i]);
                    }
                }
            }


            if (k == 0) {
                //每一點屬性都會增加生命/魔力/閃避值
                //每 1 點力量 +0.5 最大生命, 增加 0.2% 近戰物理傷害
                //每 1 點敏捷 +2 點命中值, 增加 0.2% 閃避率
                //每 1 點智慧 +0.5 最大魔力, 增加 0.2% 能量護盾                  
                var div = $("#div" + k);

                //生命
                var plife = calValues(sumMap.get("N 力量"));
                plife = (parseInt(plife) * 0.5);
                var olife = parseInt(calValues(sumMap.get("N 最大生命")).replace("+", ""));
                var olifep = parseInt(calValues(sumMap.get("增加 N 最大生命(%)")).replace("%", ""));
                var mylife = Math.round((plife + olife) * (1 + olifep / 100));
                div.append("<div class='col-md-4'>生命</div>");
                div.append("<div class='col-md-8'>" + mylife + "</div>");

                //魔力
                var intelligence = calValues(sumMap.get("N 智慧"));
                intelligence = (parseInt(intelligence) * 0.5);
                var intelligence = Math.round(intelligence + parseInt(calValues(sumMap.get("N 最大魔力")).replace("+", "")));
                div.append("<div class='col-md-4'>魔力</div>");
                div.append("<div class='col-md-8'>" + intelligence + "</div>");

                //護盾
                intelligence = calValues(sumMap.get("N 智慧"));
                intelligence = (parseInt(intelligence) * 0.2);
                var bIntelligence = parseInt(calValues(sumMap.get("N 最大能量護盾")).replace("+", ""));
                var pIntelligence = intelligence + parseInt(calValues(sumMap.get("增加 N 護甲與能量護盾(%)")).replace("%", ""));

                intelligence = Math.round(bIntelligence * (1 + pIntelligence / 100));
                div.append("<div class='col-md-4'>護盾</div>");
                div.append("<div class='col-md-8'>" + intelligence + "</div>");

                //每秒回生命
                var olifeRevert = parseFloat(calValues(sumMap.get("N 每秒生命回復")).replace("+", ""));
                var pLifeRevert = parseFloat(calValues(sumMap.get("N 每秒生命回復(%)")).replace("%", ""));
                var lifeRevert = Math.round((mylife * (pLifeRevert / 100)) + olifeRevert)
                div.append("<div class='col-md-4'>每秒生命回復</div>");
                div.append("<div class='col-md-8'>" + lifeRevert + "</div>");

                //抗性
                var keys = sumMap.keys();

                var fastness = ['冰冷', '火焰', '閃電'];
                for (var f = 0; f < fastness.length; f++) {
                    var total = 0;
                    for (var i = 0; i < keys.length; i++) {
                        if (keys[i].indexOf(fastness[f]) != -1 && keys[i].indexOf("抗性") != -1) {
                            total += parseInt(calValues(sumMap.get(keys[i])).replace("%", ""));
                        }
                    }
                    total += parseInt(calValues(sumMap.get("N 全部元素抗性(%)")).replace("%", ""));
                    div.append("<div class='col-md-4'>" + fastness[f] + "抗性</div>");
                    div.append("<div class='col-md-8'>" + total + "</div>");
                }
            }
            div.append("<div class='col-md-12'><hr /></div>")

            //總合
            var div1 = $("#div" + k);
            var keys = sumMap.keys();
            keys.sort();
            for (var i = 0; i < keys.length; i++) {
                var sumVal = calValues(sumMap.get(keys[i]));
                div1.append("<div class='col-md-4'>" + keys[i] + "</div>");
                div1.append("<div class='col-md-8'>" + sumVal + "</div>");
            }

            div1.append("<hr/>")
            for (var i = 0; i < others.length; i++) {
                div1.append("<div class='col-md-12'>" + others[i] + "</div>");
            }
        }
    });


    //其它東東
    $('#myTab a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    });

});


function maphandle(sumMap, name, val) {

    if (val == null || val == undefined) {
        return;
    }

    if (isArray(val) && val.length > 2) {
        alert(val)
    }

    //某些同詞但計量單位不同
    if (("" + val).indexOf("%") != -1) {
        name = name + "(%)";
    }

    var sum = sumMap.get(name);
    if (sum == undefined) {
        sum = [];
    }
    sum.push(val + "");
    sumMap.put(name, sum);
}

function isArray(myArray) {
    return myArray.constructor.toString().indexOf("Array") > -1;
}

function calValues(vals) {

    if (vals == null) {
        return "NA";
    }

    var total = 0;
    var symbol;

    for (var i = 0; i < vals.length; i++) {
        var v = vals[i];
        v = $.trim(v);

        if (v.indexOf("%") != -1) {
            symbol = "%";
            total += parseFloat(v.replace(/[+%]/g, ""));

        } else if (v.indexOf("+") != -1) {
            symbol = "+";
            total += parseFloat(v.replace(/[+%]/g, ""));
        } else {
            symbol = "";
            total += parseFloat(v);
        }
    }

    if ('%' == symbol) {
        return total + symbol;
    } else {
        return symbol + total;
    }
}

function base64(e) {
    function i(e, t) {
        var r = n.indexOf(e.charAt(t));
        if (r === -1)throw"Cannot decode base64";
        return r
    }

    function s(e) {
        var n = 0, r, s, o = e.length, u = [];
        e = String(e);
        if (o === 0)return e;
        if (o % 4 !== 0)throw"Cannot decode base64";
        e.charAt(o - 1) === t && (n = 1, e.charAt(o - 2) === t && (n = 2), o -= 4);
        for (r = 0; r < o; r += 4)s = i(e, r) << 18 | i(e, r + 1) << 12 | i(e, r + 2) << 6 | i(e, r + 3), u.push(String.fromCharCode(s >> 16, s >> 8 & 255, s & 255));
        switch (n) {
            case 1:
                s = i(e, r) << 18 | i(e, r + 1) << 12 | i(e, r + 2) << 6, u.push(String.fromCharCode(s >> 16, s >> 8 & 255));
                break;
            case 2:
                s = i(e, r) << 18 | i(e, r + 1) << 12, u.push(String.fromCharCode(s >> 16))
        }
        return u.join("")
    }

    function o(e, t) {
        var n = e.charCodeAt(t);
        if (n > 255)throw"INVALID_CHARACTER_ERR: DOM Exception 5";
        return n
    }

    function u(e) {
        if (arguments.length !== 1)throw"SyntaxError: exactly one argument required";
        e = String(e);
        var r, i, s = [], u = e.length - e.length % 3;
        if (e.length === 0)return e;
        for (r = 0; r < u; r += 3)i = o(e, r) << 16 | o(e, r + 1) << 8 | o(e, r + 2), s.push(n.charAt(i >> 18)), s.push(n.charAt(i >> 12 & 63)), s.push(n.charAt(i >> 6 & 63)), s.push(n.charAt(i & 63));
        switch (e.length - u) {
            case 1:
                i = o(e, r) << 16, s.push(n.charAt(i >> 18) + n.charAt(i >> 12 & 63) + t + t);
                break;
            case 2:
                i = o(e, r) << 16 | o(e, r + 1) << 8, s.push(n.charAt(i >> 18) + n.charAt(i >> 12 & 63) + n.charAt(i >> 6 & 63) + t)
        }
        return s.join("")
    }

    var t = "=", n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", r = "1.0";

    return{decode: s, encode: u, VERSION: r}
}

function ByteDecoder() {
    this.init = function () {
        this.dataString = "", this.position = 0
    },

        this.bytesToInt16 = function (e) {
            return this.bytesToInt(e, 2)
        },

        this.bytesToInt = function (e, t) {
            t = t || 4;
            var n = 0;
            for (var r = 0; r < t; ++r)n += e[r], r < t - 1 && (n <<= 8);
            return n
        },

        this.hasData = function () {
            return this.position < this.dataString.length
        }, this.getDataString = function () {
        return this.dataString
    }, this.setDataString = function (e) {
        this.dataString = e, this.position = 0
    }, this.readInt8 = function () {
        return this.readInt(1)
    }, this.readInt16 = function () {
        return this.readInt(2)
    }, this.readInt = function (e) {
        e = e || 4;
        var t = this.position + e;
        if (t > this.dataString.length)throw"Integer read exceeds bounds";
        var n = [];
        for (; this.position < t; ++this.position)n.push(this.dataString.charAt(this.position).charCodeAt(0));
        return this.bytesToInt(n, e)
    }, this.init()
}