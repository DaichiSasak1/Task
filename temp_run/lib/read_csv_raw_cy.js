// variable "network", "attribute"
var prop_vals={
    "dnfcolor":"royalblue",  //Default Node Face color
    "snfcolor":"red",   //Selected Node Face color
    "dnsize":1000,        //Default Node size
    "dewidth":3,        //Default Edge width
    "sewidth":50,       //Selected Edge width
};
var nstyle = {// "shape": "data(shape)",
                "width": "data(size)",
                "height": "data(size)",
                "label": "data(label)",
                "background-color":"data(bg)",
            };
var estyle = {  "width": "data(width)",
//                 "curve-style": "haystack",
                "line-color": "midnightblue",
                "line-style": "solid", //solid dotted dashed
//                 "target-arrow-color":"red",
                "target-arrow-shape":"triangle", //tee triangle triangle-tee triangle-cross triangle-backcurve square circle diamond none
//                "target-arrow-fill":"filled", //filled hollow
                "target-arrow-color":"black",
                "source-arrow-shape":"diamond",
                "arrow-scale": 10
            };
var JSONform = [  {  selector: "node",
                     style: nstyle   },
                  {  selector: "edge",
                     style: estyle   }   ];

var FUNCTIONform = cytoscape.stylesheet()
                    .selector("node")
                        .css(nstyle)
                    .selector("edge")
                        .css(estyle)

var cy = cytoscape({
        container: document.getElementById('cy'),
        style: FUNCTIONform
    });
var Hnet = get_TableHash(network_0);
var Hattr = get_TableHash(attribute_0);
var nframe, eframe;
// debugger;
// reHashes = resize_Net(Hnet, Hattr, 1);
// Hnet = reHashes[0];
// Hattr = reHashes[1];

get_net(Hnet);
get_attr(Hattr);

// get_net2(Hnet,Hattr);

// cy.layout({ // " http://js.cytoscape.org/#layouts "
//     name: 'preset', //"null", "random", "preset", "grid", "circle", "concentric", "breadthfirst", "cose"
//     positions:  //"node id =>position pbj" //mapData(position)
//     
// }).run();

cy.fit();
cy.minZoom(cy.zoom());
cy.maxZoom(1e+1);
eventFunc();

//****************************************************************************

    function resize_Net(Hnet, Hattr, len){
        var r_net = {}, r_attr = {};
        var n_a_key = "source";
        var n_key = ["source", "target"];
        
        for ( k in Hnet ) {
            if (Hnet[k].length < len){
                len = Hnet[k].length;
            }
            r_net[k] = Hnet[k].slice(0,len);
        }
        for (k in Hattr){
            r_attr[k] = [];
        }
        idlist = new Set();
        cou = 0
        for (i=0; i<len; i++){
            for (var k_i=0,l=n_key.length; k_i<l; k_i++){
                key = n_key[k_i];
                idt = r_net[key][i];
                if (!(idlist.has(idt))){
                    ind = Hattr[n_a_key].indexOf(idt);
                    for (k in Hattr){
                        r_attr[k][cou] = [ Hattr[k][ind] ];
                    }
                    cou +=1;
                    idlist.add(idt);
                }
            }
            
        }
        return [r_net,r_attr];
    }
//-----------------------------------------------------------------------------
    function get_TableHash(txt) {
        // 行単位で配列にする
//         var lineArr = txt.split('\n');
        var lineArr = txt.split('$')
        // 行と列の二次元配列にする
        var itemArr = [];
        for (var i = 0; i < lineArr.length; i++) {
//             itemArr[i] = lineArr[i].split('@');
            itemArr[i] = lineArr[i].split('^');
        }
        // headerをキーとした連想配列にする
        var result1 = {};
        for (var k = 0; k < itemArr[0].length; k++) {
            key = itemArr[0][k]
            result1[key] = [];
            for (var i =1; i <itemArr.length; i++){
                result1[key][i-1] = itemArr[i][k]
            }
        }
        return result1;
    }
//-----------------------------------------------------------------------------
    function Hash2HtmlTable(hash) {
        // tableで出力
        var insert = '<table>';
        insert += '<tr>';
        for (k in result1) {
            insert += "<th>"+ k +"</th>";
        }
        insert += "</tr>";
        for (var i = 0; i < result1[k].length; i++) {
            insert += "<tr>"
            for (k in result1) {
                if (result1[k][i]){
                    insert += '<td>';
                    insert += result1[k][i];
                    insert += '</td>';
                }
                else{
                    insert += "<td></td>"
                }
            }
            insert += '</tr>';
        }
        insert += '</table>';
    return insert;
    // result.innerHTML = insert;
    }
//-------------------------------------------------------------------------------
    function get_net(Htable) {
//             debugger;
            net_key =["source","target","interaction"];
            var idlist = new Set();
            //add "source" nodes to "cy"
            for (var i=0; i<Htable[net_key[0]].length; i++) {
                idt = Htable[net_key[0]][i];
                if ((idt) && !(idlist.has(idt))){
                    cy.add({    data: {id: idt , label: idt , bg:"blue", size:prop_vals["dnsize"] } });
                    idlist.add(idt);
                    
                }};
            // add "target" nodes to "cy"
            for (var i=0; i<Htable[net_key[1]].length; i++) {
                idt = Htable[net_key[1]][i];
                if ((idt) && !(idlist.has(idt))){
                    cy.add({    data: {id: idt , label: idt , bg:"blue", size:prop_vals["dnsize"] } });
                    idlist.add(idt);
                }}
            // add "interaction" edges to "cy"
            for (var i=0; i<Htable[net_key[2]].length; i++) {
                idt = Htable[net_key[2]][i];
                srct = Htable[net_key[0]][i];
                trgt = Htable[net_key[1]][i]
                
                if (idt && srct && trgt && (srct != trgt)){
                    cy.add({    
                        data: {
                            id: idt + "_" + i,
                           source: srct,
                           target: trgt,
                           width: prop_vals["dewidth"]
                        } 
                    });
                }}
        }
//----------------------------------------------------------------------------------
    function get_attr(Htable){
//         debugger;
        attr_key =["source", "authors", "date", "x", "y", "url", "size", "section", "id", "hitch"];
        //             0         1         2     3    4     5       6        7       8        9
            
        var x_scale = 1;
        var y_scale = 1;
        var c_scale = 1;
        
        
        for (var i=0; i<Htable[attr_key[0]].length; i++) {
            idt = Htable[attr_key[0]][i];
            xt = parseInt(Htable[attr_key[3]][i]) * x_scale;
            yt = parseInt(Htable[attr_key[4]][i]) * y_scale;
            ct = parseInt(Htable[attr_key[6]][i]) * c_scale;
            
            if (idt){
                cy.$id(idt).position( {x: xt,y: yt} );
                            //parent: year?
                cy.$id(idt).scratch( {
                            _author: Htable[attr_key[1]][i],
                            _date: Htable[attr_key[2]][i],
                            _url: Htable[attr_key[5]][i],
                            _section: Htable[attr_key[7]][i],
                            _arXivid: Htable[attr_key[8]][i]
                        } );
                cy.$id(idt).data().size = ct;
//                 cy.$id(idt).css("width", ct );
//                 cy.$id(idt).css("height",  ct );
                        // selected: false,
                        // selectable: true,
                        // locked: false,
                        // grabbable: true,
                        // classes: "foo bar"
                        // renderedPosition: {x: ,y: }
//                 debugger;
                };
                
                }
        cy.autolock(true);
            }
            
//----------------------------------------------------------------------------------------------------
    function get_net2(Hnet, Hattr){
        net_key =["source","target","interaction"];
        attr_key =["source", "authors", "date", "x", "y", "url", "size", "section", "id", "hitch"];
        //             0         1         2     3    4     5       6        7       8        9
        var idlist = new Set();
        
        
        for (var i=0; i<Hnet[net_key[0]].length; i++) {
            idt = Hnet[net_key[0]][i];
            attr_i = Hattr[attr_key[0]].indexOf(idt);
            xt = parseInt(Hattr[attr_key[3]][i]);
            yt = parseInt(Hattr[attr_key[4]][i]);
            ct = parseInt(Hattr[attr_key[6]][i]);
            if ((idt) && !(idlist.has(idt))){
                cy.add({    
                    data: {id: idt , label: idt},
                    position: {x: xt,y: yt},
                    height: ct,
                    width: ct
                });
                idlist.add(idt);
            }};

        for (var i=0; i<Hnet[net_key[1]].length; i++) {
            idt = Hnet[net_key[1]][i];
            attr_i = Hattr[attr_key[0]].indexOf(idt);
            xt = parseInt(Hattr[attr_key[3]][i]);
            yt = parseInt(Hattr[attr_key[4]][i]);
            ct = parseInt(Hattr[attr_key[6]][i]);
            if ((idt) && !(idlist.has(idt))){
                cy.add({    
                    data: {id: idt , label: idt},
                    position: {x: xt,y: yt},
                    height: ct,
                    width: ct
                });
                idlist.add(idt);
            }};
            
        for (var i=0; i<Hnet[net_key[2]].length; i++) {
            idt = Hnet[net_key[2]][i];
            srct = Hnet[net_key[0]][i];
            trgt = Hnet[net_key[1]][i]
                
            if (idt && srct && trgt){
                cy.add({    
                    data: {
                        id: idt + "_" + i,
                        source: srct,
                        target: trgt
                    } 
                });
            }}
    }
//--------------------------------------------------------------
    function eventFunc(){
        cy.on("click","node",function(e){openFn(e)});
//         debugger;
        cy.on("click","edge",function(e){openFe(e)});
//         cy.on("selected","node",function(e){chcolor_selected(e)});
//         cy.on("unselected","node",function(e){chcolor_unselected(e)});
    };
//--------------------------------------------------------------------
    function openFn(e){
        InitE();
//         debugger;
        if (nframe){
            nframe.closeFrame();
            nframe = undefined;
        }
        var node = e.target;
        var props = node._private.scratch;
        
        var cw = 400;
        var ch = node.id().length + props._author.length + props._date.length + props._url.length + props._arXivid.length + props._section.length;
        ch = Math.round((ch+10)/10) * 10
        var margin = 20;
        
        var jsFrame = new org.riversun.JSFrame();
        var jsFrameApp = new jsFrame.createFrameAppearance();
        var frame01 = jsFrame.createFrame(margin,margin+20,cw,ch-30, getOriginalStyle_01(jsFrameApp))//(left,top,width,height)
                .setTitle("")
                .setResizable(true)
                .setMovable(true)
                .setTitleBarClassName('style_default', 'style_focused');
        var innerHtml = ["<div id='elements_property' style='padding:10px;font-size:12px;color:gray;'>", //' https://www.colordic.org/ '
                "Title: <font color='black'>" + node.id() +"</font><br>",
                "Authors: <font color='black'>" + props._author +"</font><br>",
                "Published Date: <font color='black'>" + props._date +"</font><br>",
                "URL: <a href='"+props._url+"' target='_blank'>" + props._url + "</a><br>",
                "arXiv ID: <font color='black'>" + props._arXivid + "</font><br>",
                "Publisher: <font color='black'>" + props._section + "</font>",
                "</div>"].join("");
        frame01.setHTML(innerHtml);
        frame01.show();
        // frame01.$("#elements_property").innerHTML=<to change html>;
        // frame01.closeFrame();  ##to close frame from this code
        nframe = frame01;
        return;
    };
//--------------------------------------------------------------------
    function openFe(e){
        InitE();
        if(eframe){
            eframe.closeFrame();
            eframe = undefined;
        };
//         var edge = e.target._private.data;
        var edge = e.target;
        var src = edge.source();
        var trg = edge.target();
        var w = $(window).width()/2;
        var h = $(window).height()/2;
        var cw = 400;
        var ch = src.id().length + trg.id().length;
        ch = Math.ceil((ch+10)/10) * 10;
        var margin = 100;
        var jsFrame = new org.riversun.JSFrame();
        var jsFrameApp = new jsFrame.createFrameAppearance();
        var frame01 = jsFrame.createFrame(w+cw/4+margin,h-ch+margin,cw,ch, getOriginalStyle_01(jsFrameApp))//(left,top,width,height)
            .setTitle("")
            .setResizable(true)
            .setMovable(true)
            .setTitleBarClassName('style_default', 'style_focused');
//         debugger;
        var innerHtml = ["<div id='elements_property' style='padding:10px;font-size:12px;color:gray;'>",//' https://www.colordic.org/ '
                "Source: <font color='black'>" + src.id() +"</font><br>",
                "Target: <font color='black'>" + trg.id() + "</font>",
//                 "Source: <a href='javascript:function(){cy.viewport({zoom:1,pan:"+src.position()+"})}'>"+src.id()+" </a>",
//                 "Target: <a href='javascript:function(){cy.viewport({zoom:1,pan:"+trg.position()+"})}'>"+trg.id()+"</a>",
//                 "<script>",
//                 "document.getElemenById('edge-src').addEventListener('click',function(){cy.viewport({zoom:1,pan:"+src.position()+"})});",
//                 "document.getElemenById('edge-trg').addEventListener('click',function(){cy.viewport({zoom:1,pan:"+trg.position()+"})});",
//                 "</script>",
//                 "Source: "+func_switch(src),
//                 "Target: "+func_switch(tgt),
                "</div>"].join("");
        frame01.setHTML(innerHtml);
        frame01.show();
        eframe = frame01;
        
        cy.fit(cy.collection([src,trg]));
        src.data().bg = prop_vals["snfcolor"];
        trg.data().bg = prop_vals["snfcolor"];
        edge.css("width",prop_vals["sewidth"])
        return;
    };
//---------------------------------------------------------------------------

    
//----------------------------------------------------------------------------
    function InitE(){
        cy.nodes().forEach(function(ele,i,eles){
           ele.data().bg = prop_vals["dnfcolor"];
        });
        cy.edges().forEach(function(ele,i,eles){
            ele.css("width",prop_vals["dewidth"]);
        });
    };