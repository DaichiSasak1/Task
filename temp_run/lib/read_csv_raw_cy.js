// variable "network", "attribute"
var cy = cytoscape({
        container: document.getElementById('cy'),
        style:[{
            selector: "node",
            style: {
//                 "shape": "circle",
//                 "width": "auto",
//                 "height": "auto",
                "label": "data(label)",
            }
            
        }]
    });
var Hnet = get_TableHash(network);
var Hattr = get_TableHash(attribute);
var nframe, eframe;
// debugger;
// reHashes = resize_Net(Hnet, Hattr, 100);
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
            itemArr[i] = lineArr[i].split('@');
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
                    cy.add({    data: {id: idt , label: idt}    });
                    idlist.add(idt);
                    
                }};
            // add "target" nodes to "cy"
            for (var i=0; i<Htable[net_key[1]].length; i++) {
                idt = Htable[net_key[1]][i];
                if ((idt) && !(idlist.has(idt))){
                    cy.add({    data: {id: idt , label: idt}    });
                    idlist.add(idt);
                }}
            // add "interaction" edges to "cy"
            for (var i=0; i<Htable[net_key[2]].length; i++) {
                idt = Htable[net_key[2]][i];
                srct = Htable[net_key[0]][i];
                trgt = Htable[net_key[1]][i]
                
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
//----------------------------------------------------------------------------------
    function get_attr(Htable){
//         debugger;
        attr_key =["source", "authors", "date", "x", "y", "url", "size", "section", "id", "hitch"];
        //             0         1         2     3    4     5       6        7       8        9
            
        var x_scale = 3;
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
                cy.$id(idt).height( ct );
                cy.$id(idt).width(  ct );
                        // selected: false,
                        // selectable: true,
                        // locked: false,
                        // grabbable: true,
                        // classes: "foo bar"
                        // renderedPosition: {x: ,y: }
//                 debugger;
                };
                
                }
            }
//             cy.autolock(true);
            
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
        cy.on("mouseover","edge",function(e){openFe(e)});
        
    };
//--------------------------------------------------------------------
    function openFn(e){
//         debugger;
        if (nframe){
            nframe.closeFrame();
            nframe = undefined;
        }
        var node = e.target;
        var props = node._private.scratch;
        var jsFrame = new org.riversun.JSFrame();
        var jsFrameApp = new jsFrame.createFrameAppearance();
        var frame01 = jsFrame.createFrame(20,40,400,170)//(left,top,width,height)
                .setTitle("Paper property")
                .setResizable(true)
                .setMovable(true)
                .setTitleBarClassName('style_default', 'style_focused');
        var innerHtml = ["<div id='elements_property' style='padding:10px;font-size:12px;color:darkgray;'>",
                "Title: <font color='black'>" + node.id() +"</font><br>",
                "Authors: <font color='black'>" + props._author +"</font><br>",
                "Published Date: <font color='black'>" + props._date +"</font><br>",
                "URL: <a href='"+props._url+"' target='_blank'>" + props._url + "</a><br>",
                "arXiv ID: <font color='black'>" + props.arXivid + "</font><br>",
                "Publisher: <font color='black'>" + props._section + "</font>",
                "</div>"].join("");
        frame01.setHTML(innerHtml);
        frame01.show();
        jsFrameApp.onInitialize(showTitleBar=false);
        // frame01.$("#elements_property").innerHTML=<to change html>;
        // frame01.closeFrame();  ##to close frame from this code
        nframe = frame01;
        return;
    };
//--------------------------------------------------------------------
    function openFe(e){
        if(eframe){
            eframe.closeFrame();
            eframe = undefined;
        };
        var edge = e.target._private.data;
        var w = $(window).width();
        var h = $(window).height();
        var cw = 400;
        var ch = 100;
        var margin = 100;
        var jsFrame = new org.riversun.JSFrame();
        var jsFrameApp = new jsFrame.createFrameAppearance();
        var frame01 = jsFrame.createFrame(w-cw-margin,h-ch-margin,cw,ch)//(left,top,width,height)
            .setTitle(edge.id)
            .setResizable(false)
            .setMovable(false)
            .setTitleBarClassName('style_default', 'style_focused');
        var innerHtml = ["<div id='elements_property' style='padding:10px;font-size:12px;color:darkgray;'>",
                "Source: <font color='black'>" + edge.source +"</font><br>",
                "Target: <font color='black'>" + edge.target + "</font>",
                "</div>"].join("");
        frame01.setHTML(innerHtml);
        frame01.show();
        eframe = frame01;
        return;
    };
