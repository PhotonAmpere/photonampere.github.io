var R = 0.15;//Control points radius
var npt = 40;//Number of control points
var height = parseInt(0.8/0.8*npt*window.innerHeight/window.innerWidth/2)*2;//Height of the plot (Y amplitude)
var width = parseInt(0.8/0.8*window.innerWidth);
var dx = 0.04;//Step size for the plot
var Points = [];//List of Control points
var Xm = 0;//Mouse X position
var Ym = 0;//Mouse Y position
var eps = 0.000001;//epsilon, fitting error controle
var ordre = 0;//Spline order
var MultiSpline = "";//MultiSpline?
//Poles registration
var poles = {};
poles[2] = [Math.sqrt(8)-3];
poles[3] = [Math.sqrt(3)-2];
poles[4] = [-0.361341,-0.0135254];
poles[5] = [-0.430575,-0.0430963];
poles[6] = [-0.488295,-0.0816793,-0.00141415];
poles[7] = [-0.53528,-0.122555,-0.00914869];

var IdCurve = 0;//Curve id
var dragging = -1;//COntrole point currently being dragged
var draggingSort = ""; //Dragging control point, handlers...
var dragginghelper = -1;

//Select the order of B-Splines
document.getElementById("SelectOrder").addEventListener("change",function(){
  var txt = this.options[this.selectedIndex].getAttribute('order');
  var Ngenerators = txt.split("+").length;
  G.dx = Ngenerators;
  G.dy = Ngenerators;
  G.redraw();
  if(txt.indexOf("+")>-1){
    MultiSpline = txt
  }
  else{
    MultiSpline = 0
    ordre = parseInt(txt);
  }

  document.getElementById("interpolationof").innerHTML = Latex(this.options[this.selectedIndex].getAttribute('interpolationof')||'');
  document.getElementById("interpolationwith").innerHTML = Latex(this.options[this.selectedIndex].getAttribute('interpolationwith')||'');
  Points.redraw();
})


document.getElementById("PredefinedCurves").addEventListener("change",function(){
  c = new curve();
  switch(this.options[this.selectedIndex].value){
    case "sinx":
      for(var elt of Points.val){
        c.setYVal(x=>Math.sin(x)*height/4+height/2)
        elt.moveY(Math.sin(elt.x)*height/4+height/2)
      }
    break;
    case "sin2x":
      for(var elt of Points.val){
        c.setYVal(x=>Math.sin(2*x)*height/4+height/2)
        elt.moveY(Math.sin(2*elt.x)*height/4+height/2)
      }
    break;
    case "sin3x":
      for(var elt of Points.val){
        c.setYVal(x=>Math.sin(3*x)*height/4+height/2)
        elt.moveY(Math.sin(3*elt.x)*height/4+height/2)
      }
    break;
    case "x2":
      for(var elt of Points.val){
        c.setYVal(x=>(-(((x-npt/2+1/2)/npt*2)**2)*height+height))
        elt.moveY(-(((elt.x-npt/2)/npt*2+1/2)**2)*height+height)
      }
    break;
    case "x":
      for(var elt of Points.val){
        c.setYVal(x=>(-(((x-npt/2+1/2)/npt))*height/4+height/2))
        elt.moveY(-(((elt.x-npt/2)/npt*2+1/2))*height/4+height/2)
      }
    break;
    case "x6":
      for(var elt of Points.val){
        c.setYVal(x=>(-(((x-npt/2+1/2)/npt*2)**6)*height+height-1))
        elt.moveY(-(((elt.x-npt/2+1/2)/npt*2)**6)*height+height-1)
      }
    break;
    case "0":
      for(var elt of Points.val){
        c.setYVal(x=>-1)
        elt.moveY(height/2)
      }
    break;
    case "rand":
      for(var elt of Points.val){
        elt.moveY(height/2+height/2*(0.5-Math.random()))
        c.setYVal(x=>-1)
      }
    break;
    case "hat5":
      var n0 = Math.floor(npt/2)-1;
      for(var elt of Points.val){
        c.setYVal(x=>height/2-height/4*(Math.abs(x - n0)<=2))
        elt.moveY(height/2-height/4*(Math.abs(elt.x - n0)<=2))
      }
    break;
    case "H1":
      var n0 = Math.floor(npt/2)-1;
      for(var elt of Points.val){
        // c.setYVal(x=>height/2-H1((x-n0)/2))
        // elt.moveY(height/2-H1((elt.x-n0)/2))
        c.setYVal(x=>height/2-H1((x-n0)/2)-H2Left((x-n0)/2)+H2Right((x-n0)/2))
        elt.moveY(height/2-H1((elt.x-n0)/2))
      }
    break;
    case "H2":
      var n0 = Math.floor(npt/2)-1;
      for(var elt of Points.val){
        c.setYVal(x=>height/2-10*BetaPlus((x-n0)/2,2))
        elt.moveY(height/2-10*BetaPlus((elt.x-n0)/2,2))
      }
    break;
    case "DS1S2_1":
      var n0 = Math.floor(npt/2)-1;
      for(var elt of Points.val){
        c.setYVal(x=>height/2-DS1S2_1((x-n0)))
        elt.moveY(height/2-DS1S2_1((elt.x-n0)))
      }
    break;
    case "DS1S2_2":
      var n0 = Math.floor(npt/2)-1;
      for(var elt of Points.val){
        c.setYVal(x=>height/2-DS1S2_2((x-n0)))
        elt.moveY(height/2-DS1S2_2((elt.x-n0)))
      }
    break;
  }

  Points.redraw();
  c.redraw()
})

var svg = document.getElementById("svg");
//viewBox
 svg.setAttribute('viewBox',"0 0 " + height+" "+height);
svg.setAttribute("viewBox","0 0 "+npt+" "+height);
document.addEventListener('mouseup',function(){
  document.getElementById("measurements").innerHTML = ""
  if(dragging != -1){
    try{dragginghelper.delete();}
    catch{}
  }
  dragging = -1;
  document.body.style.cursor=""
})
document.onmousemove = function(e){
  Xm = e.clientX;
  Ym = e.clientY;
  if(dragging != -1){
    document.body.style.cursor="grab"
    //Disjonction
    switch (draggingSort) {
      case "handle1":
      case "handle2":
        var PosM = ChangementRepere(Xm,Ym)
        if(dragging.groupHandles){
          var theta = Math.atan((PosM[1]-dragging.y)/(PosM[0]-dragging.x))/Math.PI*180;
          dragging.theta = theta;
          var dist = Math.max(0,Math.sqrt((PosM[1]-dragging.y)**2+Math.min(PosM[0]-dragging.x,-0)**2))
          dragging.l1 = dist;
          dragging.l2 = dist;
        }
        else{
          currentHandle = (draggingSort.indexOf("1")>-1?1:2);
          if(currentHandle == 1){
            var theta = Math.atan((PosM[1]-dragging.y)/Math.min(PosM[0]-dragging.x,-0))/Math.PI*180;
            var dist = Math.max(0,Math.sqrt((PosM[1]-dragging.y)**2+Math.min(PosM[0]-dragging.x,-0)**2))
          }
          else{
            var theta = Math.atan((PosM[1]-dragging.y)/Math.max(PosM[0]-dragging.x,0))/Math.PI*180;
            var dist = Math.max(0,Math.sqrt((PosM[1]-dragging.y)**2+Math.max(PosM[0]-dragging.x,0)**2))
          }
          dragging["theta"+currentHandle] = Math.min(Math.max(theta,-90),90);// + (parseFloat(currentHandle)-1)*180;
          dragging["l"+currentHandle] = dist;
        }
        dragging.redraw();
        Points.redraw();
        break;
      default:
      var y0 = Math.min(height,Math.max(0,ChangementRepere(0,Ym)[1]));
        dragging.moveY(y0)
        if(MultiSpline!=0 && MultiSpline.indexOf("2D") != -1){
          dragging.moveX(Math.min(width,Math.max(0,ChangementRepere(0,Xm)[1])))
        }
        Points.redraw();
        document.getElementById("measurements").innerHTML = Approx(-y0+height/2,0.01)
    }

  }
}

document.addEventListener("touchmove",function(e){
  Xm = e.touches[0].clientX;
  Ym = e.touches[0].clientY;
  if(dragging != -1){
            document.body.style.cursor="grab"
    dragging.moveY(Math.min(height,Math.max(0,ChangementRepere(0,Ym)[1])))
    Points.redraw();
  }
})

Ph = function(toto){
  function draggable(){
    // toto.dom().addEventListener('mousedown',function(){
    //



  }
}

//   var myClick = function( click_count,elt) {
//     var handler = function(event) {
//         click_count++;

//         if(click_count == 5) {
//            // to remove
//            elt.removeEventListener('click', handler);
//         }
//     };
//     return handler;
// };

// to add

class Point{
  constructor(x=0.0, y=height/2,id=0){
    var newGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
    newGroup.setAttribute('id',"GPoint_"+id);
    svg.appendChild(newGroup);
    var newNoeud = document.createElementNS('http://www.w3.org/2000/svg','circle');
    newNoeud.setAttribute('id',"Point_"+id);
    newNoeud.setAttribute("draggable","true")
    newNoeud.setAttribute("fill","url(#g1)")
    newNoeud.setAttribute("stroke-width",R/4)
    newNoeud.setAttribute("stroke","white")
    newGroup.appendChild(newNoeud)
    newNoeud.addEventListener('touchstart',function(){
      dragging = Points.id(id);
      draggingSort = "point"
      dragginghelper = new curve();
      dragginghelper.axis.val = [Points.id(id).x,Points.id(id).x];
      dragginghelper.val = [0,height];
      dragginghelper.col('black');
      dragginghelper.stroke('#0052ff');
      dragginghelper.strokeWidth("0.1");
      dragginghelper.strokeDasharray('0.15 0.03')
      dragginghelper.redraw();
    })


    newNoeud.addEventListener('mousedown',function(){
      dragging = Points.id(id);
      dragginghelper = new curve();
      draggingSort = "point"
      dragginghelper.axis.val = [Points.id(id).x,Points.id(id).x];
      dragginghelper.val = [0,height];
      dragginghelper.col('black');
      dragginghelper.stroke('#0052ff');
      dragginghelper.strokeWidth("0.05");
      dragginghelper.strokeDasharray('0.15 0.05')
      dragginghelper.redraw();
    })

    newNoeud.addEventListener('ondrag',function(){
    })

    newNoeud.addEventListener('mouseover',function(){
      document.body.style.cursor="pointer"
    })
    this.x = x;
    this.y = y;
    this.id = id;
    this.r = R;
    this.hasHandle = false;
    this.groupHandles = true;
    this.theta = 0;
    this.theta1 = 0;
    this.theta2 = 0;
    this.l1 = 3/4;
    this.l2 = 3/4;
    this.redraw();

  }

  addHandles(groupHandles = true){
    //On créer un groupe pour ça
    var newBar = document.createElementNS('http://www.w3.org/2000/svg','g');
    newBar.setAttribute('id',"BPoint_"+this.id);
    this.domG().prepend(newBar)
    var disth = 3/4;
    //Groupes pour barres + handles
    var newGC1 = document.createElementNS('http://www.w3.org/2000/svg','g');
    newGC1.setAttribute('id','Handle1_'+this.id);
    newBar.appendChild(newGC1);
    var newGC2 = document.createElementNS('http://www.w3.org/2000/svg','g');
    newGC2.setAttribute('id','Handle2_'+this.id);
    newBar.appendChild(newGC2);
    //Barre transversale
    //à Gauche
    var newT1 = document.createElementNS('http://www.w3.org/2000/svg','line');
    newT1.setAttribute('id',"LinePoint1_"+this.id);
    newT1.setAttribute("stroke-width",0.02)
    newT1.setAttribute("stroke","blue")
    newT1.setAttribute("x1",-disth)
    newT1.setAttribute("x2",0)
    newT1.setAttribute("y1",0)
    newT1.setAttribute("y2",0)
    newGC1.appendChild(newT1)

    var newT2 = document.createElementNS('http://www.w3.org/2000/svg','line');
    newT2.setAttribute('id',"LinePoint2_"+this.id);
    newT2.setAttribute("stroke-width",0.02)
    newT2.setAttribute("stroke","blue")
    newT2.setAttribute("x1",0)
    newT2.setAttribute("x2",disth)
    newT2.setAttribute("y1",0)
    newT2.setAttribute("y2",0)
    newGC2.appendChild(newT2)

    //Handlers
    var hsize = 3/2*R
    this.hsize = hsize;
    var newH1 = document.createElementNS('http://www.w3.org/2000/svg','rect');
    newH1.setAttribute('id',"RectHandle1_"+this.id);
    newH1.setAttribute("height",hsize)
    newH1.setAttribute("width",hsize)
    newH1.setAttribute("fill","url(#g2)")
    newH1.setAttribute("stroke-width",0.0)
    newH1.setAttribute("stroke","white")
    newH1.setAttribute("x",-disth)
    newH1.setAttribute("y",-hsize/2)
    newGC1.appendChild(newH1)

    var newH2 = document.createElementNS('http://www.w3.org/2000/svg','rect');
    newH2.setAttribute('id',"RectHandle2_"+this.id);
    newH2.setAttribute("height",hsize)
    newH2.setAttribute("width",hsize)
    newH2.setAttribute("fill","url(#g2)")
    newH2.setAttribute("stroke-width",0.0)
    newH2.setAttribute("stroke","white")
    newH2.setAttribute("x",disth-hsize)
    newH2.setAttribute("y",-hsize/2)
    newGC2.appendChild(newH2)

    this.hasHandle = true
    this.groupHandles = groupHandles
    if(groupHandles){
      this.theta1 = 0
      this.theta2 = 0
    }
    else{
      this.theta = 0
    }
    this.redraw()

    //dragging
    newH1.addEventListener('mousedown',function(){
      var idt = this.getAttribute('id').split("_")[1];
      dragging = Points.id(idt);
      draggingSort = "handle1";
    })

    newH2.addEventListener('mousedown',function(){
      var idt = this.getAttribute('id').split("_")[1];
      dragging = Points.id(idt);
      draggingSort = "handle2";
    })

    newH1.addEventListener('mouseover',function(){
      document.body.style.cursor="pointer"
    })


    newH2.addEventListener('mouseover',function(){
      document.body.style.cursor="pointer"
    })
    // newH1.addEventListener('mouseout',function(){
    //   document.body.style.cursor=""
    // })
    // newH2.addEventListener('mouseout',function(){
    //   document.body.style.cursor=""
    // })
  }

  removeHandles(){
    if(this.hasHandle){
      this.domB().remove()
      this.hasHandle = false
    }
  }

  dom(){
    return(document.getElementById("Point_"+this.id))
  }

  domG(){
    return(document.getElementById("GPoint_"+this.id))
  }

  domB(){
    return(document.getElementById("BPoint_"+this.id))
  }

  domH1(){
    return(document.getElementById("Handle1_"+this.id))
  }

  domH2(){
    return(document.getElementById("Handle2_"+this.id))
  }

  domL1(){
    return(document.getElementById("LinePoint1_"+this.id))
  }

  domRect1(){
    return(document.getElementById("RectHandle1_"+this.id))
  }

  domRect2(){
    return(document.getElementById("RectHandle2_"+this.id))
  }

  domL2(){
    return(document.getElementById("LinePoint2_"+this.id))
  }

  redraw(){
    var pt = this.dom();
    pt.setAttribute('cx',0)
    pt.setAttribute('cy',0)
    pt.setAttribute('r',this.r)
    var Gpt = this.domG();
    Gpt.setAttribute('transform','translate('+this.x+','+this.y+')')
    if(MultiSpline == "D S2+S4"){
      Gpt.setAttribute('transform','translate('+(this.x+1)+','+this.y+')')
    }

    if(this.hasHandle){
      this.domB().setAttribute("transform","rotate("+this.theta+")")
      this.domH1().setAttribute("transform","rotate("+this.theta1+")")
      this.domH2().setAttribute("transform","rotate("+this.theta2+")")
      this.domL1().setAttribute("x1",-this.l1)
      this.domL2().setAttribute("x2",this.l2)
      this.domRect1().setAttribute("x",-this.l1)
      this.domRect2().setAttribute("x",this.l2-this.hsize)
    }
    //pt.setAttribute('cy',this.y)
    //pt.setAttribute('r',this.r)
  }

  moveY(y){
    this.y = y;
    this.redraw();
  }

  moveX(x){
    this.x = x;
    this.redraw();
  }

  hide(){
    this.domG().setAttribute('visibility','hidden')
  }

  show(){
    this.domG().setAttribute('visibility','show')
  }
}

class p{
  constructor(){
    this.val = [];
    this.axis = new np(0,npt+dx,dx);
    this.handleStep = 1;
    this.hasHandle = false;
  }

  push(Point){
    this.val.push(Point)
  }


  length(){
    return(this.val.length)
  }

  id(n){
    for(var elt of this.val){
      if(elt.id == n){
        return(elt)
      }
    }
    console.warn("Aucun point avec l'id "+n+" n'a été trouvé !")
    return(null)
  }

  posY(){
    var ans = [];
    var count = 0;
    for(var elt of this.val){
      if(!this.hasHandle | elt.hasHandle){
        ans.push(elt.y)
      }
    }
    return(ans)
  }

  posX2D(){
    var ans = [];
    var count = 0;
    for(var elt of this.val){
      if(!this.hasHandle | elt.hasHandle){
        ans.push(elt.x)
      }
    }
    return(ans)
  }

  DY2D(){
    var ans = [];
    var count = 0;
    for(var elt of this.val){
      if(!this.hasHandle | elt.hasHandle){
        ans.push(Math.sin(elt.theta/180*Math.PI)*elt.l1)
      }
    }
    return(ans)
  }

  DX2D(){
    var ans = [];
    var count = 0;
    for(var elt of this.val){
      if(!this.hasHandle | elt.hasHandle){
        ans.push(Math.cos(elt.theta/180*Math.PI)*elt.l1)
      }
    }
    return(ans)
  }

  DY(){
    var ans = [];
    for(var elt of this.val){
      if(elt.hasHandle){
        ans.push(Math.tan(elt.theta/180*Math.PI))
      }
    }
    return(ans)
  }

  DY_l(){
    var ans = [];
    for(var elt of this.val){
      if(elt.hasHandle){
        ans.push(Math.tan(elt.theta1/180*Math.PI))
      }
    }
    return(ans)
  }

  DY_r(){
    var ans = [];
    for(var elt of this.val){
      if(elt.hasHandle){
        ans.push(Math.tan(elt.theta2/180*Math.PI))
      }
    }
    return(ans)
  }

  //Liste des posY et derivee pour interpolation derivee
  posYDY(){
    var ans = [];
    for(var elt of this.val){
      if(elt.hasHandle | elt.hasHandle){
        ans.push(elt.y)
        ans.push(Math.tan(elt.theta/180*Math.PI))
      }
    }
    return(ans)
  }

  posX(){
    var ans = [];
    for(var elt of this.val){
      ans.push(elt.id)
    }
    return(ans)
  }

  dom(){
    return document.getElementById("splinefit");
  }

  removeHandles(){
    for(var elt of this.val){
      elt.removeHandles();
      elt.show();
    }
    this.hasHandle = false;
  }

  hideControlPoints(){
    for(var elt of this.val){
      elt.hide()
    }
  }

  showControlPoints(){
    for(var elt of this.val){
      elt.show()
    }
  }

  addHandles(step = 2,groupHandles = true){
    for(var elt of this.val){
      if(elt.id/step == Math.floor(elt.id/step)){
        elt.addHandles(groupHandles);
      }
      else{
        elt.hide(groupHandles);
      }
    }
    this.handlesStep = step;
    this.hasHandle = true;
  }

  col(col){
    this.dom().setAttribute('stroke',col)
  }
  redraw(){
    Points.removeHandles();
    var xl = this.axis.val;
    //Coeffs
    if(MultiSpline == ""){
      var s = Fit(this.axis.val,ConvertToInterpolationCoefficients(this.posY(),poles[ordre],eps));
    }
    else{

      if(MultiSpline.indexOf("D") == -1){
        //if(MultiSpline.inde)
        var s = FitMulti(this.axis.val,this.posY());

      }
      else if(MultiSpline == "2D+"){
      //   Points.removeHandles();
      //   var s = Fit(this.axis.val,ConvertToInterpolationCoefficients(this.posY(),poles[ordre],eps));
      //   var xl = Fit(this.axis.val,ConvertToInterpolationCoefficients(this.posX2D(),poles[ordre],eps));
      Points.addHandles();
      var s = FitHermite(this.axis.val,intercal([this.posY(),this.DY2D()]))

      var xl = FitHermite(this.axis.val,intercal([this.posX2D(),this.DX2D()]))
      }
      else{
        if(MultiSpline == "D S4+S5"){
          Points.addHandles();
          var s = FitH1H2S4S5(this.axis.val,this.posY(),this.DY())
          //var s = FitHermite(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D2 S3+S5"){
          Points.addHandles();
          var s = FitH1H2S3S5(this.axis.val,this.posY(),this.DY())
          //var s = FitHermite(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D2 S3+S4"){
          Points.addHandles();
          var s = FitH1H2S3S4(this.axis.val,this.posY(),this.DY())
          //var s = FitHermite(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D S2+S4"){
          Points.addHandles();
          var s = FitH1H2S2S4(this.axis.val,this.posY(),this.DY())

          //var s = FitHermite(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D S6+S7"){
          Points.addHandles();
          var s = FitH1H2S6S7(this.axis.val,this.posY(),this.DY())
          //var s = FitHermite(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D S1+S2"){
          Points.addHandles();
          var s = FitDS1S2(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D S2+S3"){
          Points.addHandles();
          var s = FitHermite(this.axis.val,this.posYDY());
        }
        else if(MultiSpline == "D S1+S2+S3"){
          Points.addHandles(3,false);
          var s = FitHermiteS1S2S3(this.axis.val,intercal([this.posY(),this.DY_l(),this.DY_r()]));
        }


      }
    }
    //

    this.dom().setAttribute('d',List2Path(xl,s));
  }
}

function intercal(Ll){
ans = [];
for(var i = 0;i<Ll[0].length;i++){
  for( var toto of Ll){
    ans.push(toto[i])
  }
}
return(ans)
}
class curve{
  constructor(id = IdCurve){

    this.axis = new np(0,npt+2*dx,dx);
    this.val = [];
    this.id = id;
    IdCurve+=1;
    var newP = document.createElementNS('http://www.w3.org/2000/svg','path');
    newP.setAttribute('id',"Curve_"+this.id);
    newP.setAttribute('stroke',"black");
    newP.setAttribute('stroke-width',0.03);
    newP.setAttribute('fill',"none");
    document.getElementById("Curve").appendChild(newP);

  }

  delete(){
    this.dom().remove();
  }
  setYVal(r,off){
    off = off || false;
    this.val = []
    var f0 = function(x){return(0)}
    r = r || f0;
    for(var elt of this.axis.val){
      this.val.push(-r(elt-npt/2*off)+height/2*off)
    }


  }

  dom(){
    return document.getElementById("Curve_"+this.id);
  }

  col(col){
    this.dom().setAttribute('stroke',col)
  }

  stroke(col){
    this.dom().setAttribute('stroke',col)
  }
  strokeWidth(col){
    this.dom().setAttribute('stroke-width',col)
  }
  strokeDasharray(col){
    this.dom().setAttribute('stroke-dasharray',col)
  }

  dash(dash){
    this.dom().setAttribute('dash-array',dasharray)
  }

  redraw(){
    this.dom().setAttribute('d',List2Path(this.axis.val,this.val));
  }

  delete(){
    this.dom().remove();
  }




}

class grid{
  constructor(dx = 1, dy = 1,id = 0){
    this.dx = dx;
    this.dy = dy;
    this.id = id;
    //Dom
    var newG = document.createElementNS('http://www.w3.org/2000/svg','g');
    newG.setAttribute('id',"Grid_"+this.id);
    document.getElementById("Background").appendChild(newG);
  }

  dom(){
    return(document.getElementById("Grid_"+this.id))
  }
  redraw(){
    var gd = this.dom();
    while (gd.firstChild) {
      gd.removeChild(gd.firstChild);
    }
    for(var i = 0;i < npt/this.dx;i++){
        var newL = document.createElementNS('http://www.w3.org/2000/svg','line');
        newL.setAttribute('x1',i*this.dx);
        newL.setAttribute('x2',i*this.dx);
        newL.setAttribute('y1',0);
        newL.setAttribute('y2',height);
        newL.setAttribute('stroke-width',0.01);
        newL.setAttribute('stroke','gray');
        newL.setAttribute('stroke-dasharray',"0.1 0.05");
        gd.appendChild(newL);
    }

    //Horizontal Line
    for(var j = 0;j < height/this.dy;j++){
      var newL = document.createElementNS('http://www.w3.org/2000/svg','line');
      newL.setAttribute('x1',0);
      newL.setAttribute('x2',npt);
      newL.setAttribute('y1',j*this.dy);
      newL.setAttribute('y2',j*this.dy);
      newL.setAttribute('stroke-width',0.01);
      newL.setAttribute('stroke','gray');
      newL.setAttribute('stroke-dasharray',"0.1 0.05");
      gd.appendChild(newL);
    }
  }
}

//Draw the grid
var G = new grid(1,1,0);
G.redraw();

class np{
  constructor(xd,xf,dx){
    this.val = [];
    var ntot = Math.floor((xf-xd-1)/dx);
    for(var i = 0;i<ntot;i++){
      this.val.push(xd+i*dx)
    }
  }
}

var Points = new p();
for(var i = 0;i<npt;i++){
  Points.push(new Point(i,height/2,i))
  if(Math.floor(i/2) == i/2){
    Points.val[Points.val.length-1].addHandles()
  }
}
Points.redraw()

function ChangementRepere(x,y){
  var pt = svg.createSVGPoint();
  var MatrixTransfo = svg.getScreenCTM().inverse()
  pt.x = parseFloat(x);
  pt.y = parseFloat(y);
  pt = pt.matrixTransform(MatrixTransfo);
  return([pt.x,pt.y])
}

function List2Path(Lx,Ly){
  str = "M";
  for(var i = 0;i<Lx.length;i++){
    str+=" "+Lx[i]+" "+Ly[i]
  }
  return(str)
}

//Splines
// function Beta(x){
//   switch(ordre){
//     case 0:
//       return((x<=1/2)*1*(x>-1/2))
//     case 1:
//       return((Math.abs(x)<1)*((x<=0)*(x+1)+(x>0)*(-x+1)))
//     case 2:
//       return((Math.abs(x)<3/2)*((x<=0)*(x**2/2+x-3/4)+(x>0)*(x**2/2+x-3/4)))
//     case 3:
//       return((Math.abs(x)<1)*(2/3 - x*x +Math.abs(x)**3/2)+(Math.abs(x)>=1)*(Math.abs(x)<2)*((2-Math.abs(x))**3/6))
//     break;
//
//
//   }
// }

function Beta(x,nordre){
  nordre = nordre>=0?nordre:ordre;
  if(nordre == 0){
    return((x<=1/2)*1*(x>-1/2))
  }
  else{
    return(1/nordre*( ((nordre+1)/2 + x)*Beta(x+1/2,nordre-1) + ((nordre+1)/2 - x)*Beta(x-1/2,nordre-1)))
  }
}

function BetaPlus(x,nordre){
  return(Beta(x-(nordre+1)/2,nordre))
}

function Phi1(x){
    return(0+(x<=2)*(x>-2)*(12*BetaPlus(x/2,2) + 4*BetaPlus(x/2+1,2) - 8*BetaPlus(x/2,1) - 1*BetaPlus(x/2+1,1)))
}

function Phi2(x){
    return(0+(x<=2)*(x>0)*(4*BetaPlus(x/2,1) - 8*BetaPlus(x/2,2)))
}

function Eta(x,N,N0,j){
  var ans = 1;
  if(j==1){
    if(x<=-N | x>=N){
      return(0)
    }
    else if(x>0){
      for(var i=1;i<=N;i++){
        ans = ans*(1-x/i)
      }
    }
    else{
      for(var i=1;i<=N;i++){
        ans= ans*(1+x/i)
      }
    }

  }
  else{
    if(x<=0 | x>=N){
      return(0)
    }
    //ans*=x/(j-1);
    for(var i=0;i<=N;i++){
      if(i!=(j-1)){
        ans*=(x-i)/((j-1)-i)
      }
    }
  }
  return(ans)
}

function FitMulti(x,c){
  //On tente de moyenner
  var L = MultiSpline.split("+");
  var N = parseInt(L[L.length-1]);
  var N0 = parseInt(L[0]);
  ans = [];
  for(var xi of x){
    var i0 = Math.floor(xi/N);
    valtoadd = 0;
    for(var j = 1;j<=N;j++){
      valtoadd += (c[N*i0+(j-1)]||c[(j-1)])*Eta(xi-N*i0,N,N0,j)
    }
    valtoadd += (c[N*i0+N]||c[N])*Eta(xi-N*i0-N,N,N0,1)
    ans.push(valtoadd);
  }
  // if(MultiSpline = "1+2"){
  //   ans = [];
  //   for(var xi of x){
  //     var i0 = Math.floor(xi/2);
  //
  //     valtoadd = (c[2*i0+1]||c[2*i0-1])*Phi2(xi-2*i0) + (c[2*i0+2]||c[2*i0-2])*Phi1(xi-2*i0-2)+(c[2*i0]||0)*Phi1(xi-2*i0);
  //     ans.push(valtoadd);
  //     //ans.push(Phi2((xi-10))+10)
  //   }
  // }
    return(ans)

}

function FitHermite(x,c){
  //
  var N = 2
  ans = [];
  for(var xi of x){
    var valtoadd = 0;
    var i0 = Math.floor(xi/N);
    valtoadd += (c[N*i0])*H1(xi/N-i0)
    valtoadd += N*(c[N*i0+1])*H2(xi/N-i0)
    if(N*i0+2>=c.length-1){
      valtoadd += (c[N*i0])*H1(xi/N-1-i0)
    }
    else{
      valtoadd += (c[N*i0+2])*H1(xi/N-1-i0)
    }
    if(N*i0+3>=c.length-1){
      valtoadd += N*(c[N*i0+1])*H2(xi/N-1-i0)
    }
    else{
      valtoadd += N*(c[N*i0+3])*H2(xi/N-1-i0)
    }

    ans.push(valtoadd);
  }

  return(ans)
}

function FitHermiteS1S2S3(x,c){
  //Controler position, dérivee à droite et à gauche
  var N = 3
  ans = [];
  for(var xi of x){
    var valtoadd = 0;
    var i0 = Math.floor(xi/N);
    valtoadd += (c[N*i0])*H1(xi/N-i0)
    valtoadd += N*(c[N*i0+1])*H2Left(xi/N-i0)
    valtoadd += N*(c[N*i0+2])*H2Right(xi/N-i0)
    if(N*i0+3>=c.length-1){
      valtoadd += (c[N*i0])*H1(xi/N-1-i0)
    }
    else{
      valtoadd += (c[N*i0+3])*H1(xi/N-1-i0)
    }
    if(N*i0+4>=c.length-1){
      valtoadd += N*(c[N*i0+1])*H2Left(xi/N-1-i0)
    }
    else{
      valtoadd += N*(c[N*i0+4])*H2Left(xi/N-1-i0)
    }
    if(N*i0+5>=c.length-1){
      valtoadd += N*(c[N*i0+2])*H2Right(xi/N-1-i0)
    }
    else{
      valtoadd += N*(c[N*i0+5])*H2Right(xi/N-1-i0)
    }
    ans.push(valtoadd);
  }

  return(ans)
}

function FitDS1S2(x,c){
  //
  var N = 2
  ans = [];
  for(var xi of x){
    var valtoadd = 0;
    var i0 = Math.floor(xi/N);
    valtoadd += (c[N*i0])*DS1S2_1(xi-i0*N)
    if(N*i0+3>c.length-1){
      valtoadd = (c[N*i0+1])*DS1S2_2(xi-(i0+1)*N)
    }
    else{
      valtoadd += (c[N*i0+3])*DS1S2_2(xi-(i0+1)*N)
    }

    if(N*i0+2>=c.length-1){
      valtoadd += (c[N*i0])*DS1S2_1(xi-N-i0*N)
    }
    else{
      valtoadd += (c[N*i0+2])*DS1S2_1(xi-N-i0*N)
    }

    ans.push(valtoadd);
  }

  return(ans)
}

//Spline cubique de Hermite 1
function H1(x){
return(0+(Math.abs(x)>=0)*(Math.abs(x)<=1)*(2*Math.abs(x)+1)*(Math.abs(x)-1)**2)
}

//Spline cubique de Hermite 2
function H2(x){
return((0+(Math.abs(x)>=0)*(Math.abs(x)<=1)*x*(Math.abs(x)-1)**2))
}

//Spline cubique de Hermite 2 left
function H2Left(x){
return((0+(x>=-1)*(x<=0)*x*(Math.abs(x)-1)**2))
}

function H2Right(x){
return((0+(x>=0)*(x<=1)*x*(Math.abs(x)-1)**2))
}

//S1 + S2 avec derivee
function DS1S2_2(x){
return((x>-2)*(x<0)*(x+2)*x)
}

function DS1S2_1(x){
return((x>=0)*(x<2)*(x-2)**2/4 +(x<0)*(x>-2)*(1-x**2/4))
}
function c1(x){
  return((x<=1)*0.5*(x>-1))
}

function c1supp(){
  return([-1,0,1])
}

function t1(x){
  x = x-0;
  return((Math.abs(x)<=2)*0.5*( (x<0)*0.5*(x+2) + (x>=0)*(0.5)*(-x+2)))
}

function t1supp(){
  return([-2,-1,0,1,2])
}

function c12(x){
  return((x<2)*0.5*(x>0)+0.25*(x==0)+0.25*(x==2))
}

function c12supp(){
  return([-1,0,1,2])
}

function t12(x){
  x = x-2;
  return((Math.abs(x)<=2)*0.5*( (x<0)*0.5*(x+2) + (x>=0)*(0.5)*(-x+2)))
}

function t12supp(){
  return([-2,-1,0,1,2,3,4])
}

function Fitc1t1(x,cc,ct){
  var i0 = Math.ceil(x/2);
  var ans  = 0;
  for(var i of c1supp()){
    if((i+i0)>=0 & (i+i0)<cc.length){
      ans += cc[i+i0]*c1(x-2*(i+i0))
    }
  }
  for(var i of t1supp()){
    if((i+i0)>=0 & (i+i0)<ct.length){
      ans += ct[i+i0]*t1(x-2*(i+i0))
    }
  }
  return(ans)
}

function Fitc12t12(x,cc,ct){
  var i0 = Math.ceil((x)/2);
  var ans  = 0;
  for(var i of c12supp()){
    if((i+i0)>=0 & (i+i0)<cc.length){
      ans += cc[i+i0]*c12(x-2*(i+i0))
    }
  }
  for(var i of t12supp()){
    if((i+i0)>=0 & (i+i0)<ct.length){
      ans += ct[i+i0]*t12(x-2*(i+i0))
    }
  }
  return(ans)
}

function ConvertToInterpolationCoefficients(c,z,Tolerance){
  var DataLength = c.length
  z = z || [];
  var NbPoles = z.length;
  var Lambda = 1.0
  //Cas genral on retourne la reponse impulsionnelle de 1/produit (1-z0z**-1)(1-z0**-1z**-1)
  if(MultiSpline != 0 && MultiSpline.indexOf("2D") == -1){
    for(var k =0;k<NbPoles;k++){
        c[0] = InitialCausalCoefficient(c, DataLength, z[k], Tolerance)
        //Causal Filtering
        for(var n = 1;n<DataLength;n++){
          c[n] += z[k] * c[n - 1]
        }
        c[DataLength - 1] = (z[k] / (z[k] * z[k] - 1.0))* (z[k] * c[DataLength - 2] + c[DataLength - 1])
        //Anti-Causal Filtering
        for(var n = DataLength-2;n>-1;n--){
            c[n] = z[k] * (c[n+1]- c[n])

        }
        for(var n = 0;n<DataLength;n++){
          c[n] = -c[n]
        }
    }
  }
  //Cas particulier cf papiers
  else if(ordre>1){
    if (DataLength == 1){
        return
    }
    for(var k =0;k<NbPoles;k++){
      Lambda = Lambda * (1.0 - z[k]) * (1.0 - 1.0 / z[k])
    }
    for(var n =0;n<DataLength;n++){
         c[n] *= Lambda
    }
    for(var k =0;k<NbPoles;k++){
        c[0] = InitialCausalCoefficient(c, DataLength, z[k], Tolerance)
        //Causal Filtering
        for(var n = 1;n<DataLength;n++){
          c[n] += z[k] * c[n - 1]
        }
        c[DataLength - 1] = (z[k] / (z[k] * z[k] - 1.0))* (z[k] * c[DataLength - 2] + c[DataLength - 1])
        //Anti-Causal Filtering
        for(var n = DataLength-2;n>-1;n--){
            c[n] = z[k] * (c[n+1]- c[n])
            //c[n] = z[k] * (c[n+1]- c[n])
        }
    }
  }
  return(c)
}

function PWSum(Arr1,Arr2){
  return(Arr1.map((a,i)=>a+Arr2[i]))
}

//Pour les Splines de Hermites S4+S5, test
function FitH1H2S4S5(x,Y,DY){
  //Y = pos function en y
  //DY = dérivée
   //Voir rapport pour explications
   //C11 0.125 z -0.125  & -0.1z+0.1
   var C1 = Y.map(function(a, i){
     if(i == Y.length-1){
       return(16*(0.125*a +0.125*Y[i-1] +2*(- 0.1*DY[i-1]+0.1*DY[i])))
     }
     else{
       return(16*(0.125*a+0.125*Y[i+1] +2*(- 0.1*DY[i+1]+0.1*DY[i])))
     }
   });

   var C2 = Y.map(function(a, i){
     if(i == Y.length-1){
       return(16*(1.25*a-1.25*Y[i-1] + 2*(0.5*DY[i-1]+0.5*DY[i])))
     }
     else{

       return(16*(1.25*a-1.25*Y[i+1] + 2*(0.5*DY[i+1]+0.5*DY[i])))
     }
   });
   ordre = 2

   C1 = ConvertToInterpolationCoefficients(C1,[3-Math.sqrt(8)],eps)
   C2 = ConvertToInterpolationCoefficients(C2,[3-Math.sqrt(8)],eps)

   return(FitNFunction(x,[C1,C2],[[H1H2S4S5_1,3],[H1H2S4S5_2,3]]))

}

function FitH1H2S3S5(x,Y,DDY){
  //Y = pos function en y
  //DY = dérivée
   //Voir rapport pour explications
   //C11 0.125 z -0.125  & -0.1z+0.1
   var C1 = Y.map(function(a, i){
     ip1 = (i+1)>Y.length-1?i-1:i+1;
     im1 = i-1<0?i+1:i-1;
       return(-30/7*(Y[ip1]+2/30*DDY[ip1]))
   });

   var C2 = Y.map(function(a, i){
     ip1 = (i+1)>Y.length-1?i-1:i+1;
     im1 = i-1<0?i+1:i-1;
       return(-30/7*(2*Y[i] - Y[ip1] - Y[im1] + 1/6*DDY[ip1]+ 1/6*DDY[im1] + 4/6*DDY[i]))
   });
   ordre = 2

   C1 = ConvertToInterpolationCoefficients(C1,[-8/7+Math.sqrt(15)/7],eps)
   C2 = ConvertToInterpolationCoefficients(C2,[-8/7+Math.sqrt(15)/7],eps)

   return(FitNFunction(x,[C1,C2],[[H1H2S3S5_1,4],[H1H2S3S5_2,4]]))

}

function FitH1H2S2S4(x,Y,DY){
  //Y = pos function en y
  //DY = dérivée, mais on doit multiplier par 2
   //Voir rapport pour explications
   //C11 0.125 z -0.125  & -0.1z+0.1
   var C1 = Y.map(function(a, i){
     ip1 = (i+1)>Y.length-1?i-1:i+1;
     im1 = i-1<0?i+1:i-1;
       return(-32/7*(Y[i] + 2*3/32*(DY[ip1] - DY[i])))
   });

   var C2 = Y.map(function(a, i){
     ip1 = (i+1)>Y.length-1?i-1:i+1;
     im1 = i-1<0?i+1:i-1;
       return(-32/7*( -Y[i] + Y[im1] + 2/8*(DY[im1]+DY[ip1] + 6*DY[i])))
   });
   ordre = 2

   C1 = ConvertToInterpolationCoefficients(C1,[-9/7+Math.sqrt(32)/7],eps)
   C2 = ConvertToInterpolationCoefficients(C2,[-9/7+Math.sqrt(32)/7],eps)
   return(FitNFunction(x,[C1,C2],[[H1H2S2S4_1,4],[H1H2S2S4_2,4]]))

}

function FitH1H2S3S4(x,Y,DY){
  //Y = pos function en y
  //DY = dérivée, mais on doit multiplier par 2
   //Voir rapport pour explications
   //C11 0.125 z -0.125  & -0.1z+0.1
   var C1 = Y.map(function(a, i){
      return(Y[i])
   });

   var C2 = Y.map(function(a, i){
     ip1 = (i+1)>Y.length-1?i-1:i+1;
     im1 = i-1<0?i+1:i-1;
       return(Y[i]/2 + Y[ip1]/2 - DY[ip1]/6)
   });

   return(FitNFunction(x,[C1,C2],[[H1H2S3S4_1,4],[H1H2S3S4_2,4]]))

}

function FitH1H2S6S7(x,Y,DY){
  //Y = pos function en y
  //DY = dérivée
   //Voir rapport pour explications
   //C11 0.125 z -0.125  & -0.1z+0.1
   var C1 = Y.map(function(a, i){
     if(i == Y.length-1){
       return(16*(0.125*a +0.125*Y[i-1] +2*(- 0.1*DY[i-1]+0.1*DY[i])))
     }
     else{
       return(16*(0.125*a+0.125*Y[i+1] +2*(- 0.1*DY[i+1]+0.1*DY[i])))
     }
   });

   var C2 = Y.map(function(a, i){
     if(i == Y.length-1){
       return(16*(1.25*a-1.25*Y[i-1] + 2*(0.5*DY[i-1]+0.5*DY[i])))
     }
     else{

       return(16*(1.25*a-1.25*Y[i+1] + 2*(0.5*DY[i+1]+0.5*DY[i])))
     }
   });
   ordre = 2

   C1 = ConvertToInterpolationCoefficients(C1,[3-Math.sqrt(8)],eps)
   C2 = ConvertToInterpolationCoefficients(C2,[3-Math.sqrt(8)],eps)

   return(FitNFunction(x,[C1,C2],[[H1H2S6S7_1,4],[H1H2S6S7_2,4]]))

}


function PolySeg(x,Coeff){
  var yans = 0
  var count = -1
  for (var elt of Coeff){
    count++
    yans+= x**count*elt
  }
  return(yans)
}

function functionFromCoeff(x,ArrCoeff){
  if(x<=0 | x>= ArrCoeff.length){
    return(0)
  }
  else{
    var inu = Math.floor(x)
    return(PolySeg(x-inu,ArrCoeff[inu]))
  }
}

var H1H2S4S5_1 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.0, 0.0, 1.25, -0.75], [0.5, 1.25, 0.0, -2.5, 1.25, 0.0], [0.5, -1.25, 0.0, 2.5, -2.5, 0.75]])
var H1H2S4S5_2 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.0, 0.0, 0.375, -0.275], [0.1, 0.125, -0.5, -1.25, 2.375, -0.95], [-0.1, 0.125, 0.5, -1.25, 1, -0.275]])

var H1H2S3S5_1 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.0, 1/6], [1/6, 0.5, 0.5, -0.5], [2/3, 0.0, -1.0, 0.5], [1/6, -0.5, 0.5, -1/6]])
var H1H2S3S5_2 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.0, -1/6, 0.0, 0.1], [-2/30, 0.0, 0.5, -5/6, 0.5, -0.1]])


var H1H2S2S4_1 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.5], [0.5, 1.0, -1.0], [0.5, -1.0, 0.5]])
var H1H2S2S4_2 = x=>functionFromCoeff(x,[[0.0, 0.0, -0.5, 0.0, 0.5], [0.0, 1, -2.5, 2, -0.5]])

var H1H2S3S4_1 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.0, 4, -3], [1, 0.0, -6, 8, -3]])
var H1H2S3S4_2 = x=>functionFromCoeff(x,[[0.0, 0.0, 0.0, -1, 1], [0.0, 1, 3, -8, 4], [0.0, -1, 3, -3, 1]])

function InitialCausalCoefficient(c,DataLength,z,Tolerance){
  var Horizon = Math.ceil(Math.log(Tolerance) / Math.log(Math.abs(z)))
  if(DataLength < Horizon){
      Horizon = DataLength;
  }
  var zn = z
  var Sum = c[0]
  for(var n = 1;n<Horizon;n++){
      Sum += zn * c[n]
      zn *= z
  }
  return(Sum+0.0)
}

//Return the list of shift giving non zero
function SplineSupport(){
  var ans = [];
  if(ordre == 0){
    return([-1,0,1])
  }
  for(var i = -parseInt((ordre+1)/2);i<parseInt((ordre+1)/2)+1;i++){
    ans.push(i)
  }
  return(ans)
}

function BoundaryIndex(index){
    if(index>=npt){
      return((npt-1)-(index-(npt-1)))
    }
    else if(index<0){
      return(-index)
    }
    else{
      return(index)
    }

}

function BoundaryIndex2(index){
    if(index>=npt/2){
      return((npt/2-1)-(index-(npt/2-1)))
    }
    else if(index<0){
      return(-index)
    }
    else{
      return(index)
    }

}

function BoundaryIndexN(index,N){
    if(index>=npt/N){
      return((npt/N-1)-(index-(npt/N-1)))
    }
    else if(index<0){
      return(-index)
    }
    else{
      return(index)
    }

}

function FitNFunction(x,C,funcsupp){

  //x = liste de points
  //C = Array de coeff
  //Funcsupp = [[func1,supp1],...]
  var ans = 0
  var count = -1;
  var y;
  for(var fdata of funcsupp){
    count++
    var fbasis = fdata[0]
    var supp = fdata[1]
    var c = C[count]
    if(count == 0){

      y = FitSingleFunction(x,c,fbasis,supp)

    }
    else{
      y = PWSum(y,FitSingleFunction(x,c,fbasis,supp))
    }
  }
  // for(var i = 0;i<y.length;i++){
  //   y[i]+=7
  // }
  return(y)
}

function FitSingleFunction(x,c,func,supp){

  var ans = []
  for(var j = 0;j < x.length;j++){
    var val = 0;
    var i = Math.floor(x[j]/2);
    //On parcours les indices ou Beta non null
    for(var index = 0;index>=-supp;index--){
      //val+= c[BoundaryIndex2(index+i)]*func(x[j]-(index+i))/400

      val += c[BoundaryIndex2(index+i+1)]*func(x[j]/2-i-(index))

    }
    ans.push(val)
  }

  return(ans)
}
function Fit(x,c){
  var ans = [];
  var Ss = SplineSupport();
  for(var j = 0;j < x.length;j++){
    var val = 0;
    var i = Math.round(x[j]);
    //On parcours les indices ou Beta non null
    for(var index of Ss){
      val+= c[BoundaryIndex(index+i)]*Beta(x[j]-(index+i))
    }
    ans.push(val)
    // var i1 = (i-1)>=0?i-1:1;
    // var i01 = (i-2)>=0?i-2:2;
    // var i2 = i;
    // var i3 = (i+1)<(c.length)?i+1:(c.length-1);
    // var i03 = (i+2)<(c.length)?i+2:(c.length-2);
    // ans.push(c[i01]*Beta(x[j]-(i-2))+c[i1]*Beta(x[j]-(i-1))+c[i2]*Beta(x[j]-(i))+c[i3]*Beta(x[j]-(i+1))+c[i03]*Beta(x[j]-(i+2)))
  }
  return(ans)
}


function Translate(n){
  for(var tt = 0;tt<Points.val.length;tt++){
    pp = Points.val.length-1 - tt;
    indice = pp-n>=0?pp-n:Points.val.length-n;
    Points.val[pp].moveY(Points.val[indice].y)
    //elt.moveY(6*Math.sin(1/6*t-elt.id/5)+Math.sin(1/2*t-elt.id*12))
    //elt.moveY(3*Math.sin(1/3*(t+elt.id*2))+height/2)
  }
  Points.redraw();
}
function AutoMove(t,dt){
  for(elt of Points.val){
    elt.moveY(3*Math.sin(1/3*(t-elt.id*2))+3*Math.sin(1/8*(t+elt.id*2))+height/2)
    //elt.moveY(6*Math.sin(1/6*t-elt.id/5)+Math.sin(1/2*t-elt.id*12))
    //elt.moveY(3*Math.sin(1/3*(t+elt.id*2))+height/2)
  }
  Points.redraw();
  setTimeout(function(){
    AutoMove(t+dt,dt)
  },dt)
}

function AutoMove2(t,dt,cv){
  if(t==0){
    var cv = new curve();


  }
  cv.setYVal(x=>3*Math.sin(1/3*(t-x*2))+3*Math.sin(1/8*(t+x*2))+height/2)
  cv.redraw();
  setTimeout(function(){
    AutoMove2(t+dt,dt,cv)
  },dt)
}

function plotcurve(fck,col="black"){
var ut = new curve()
var n0 = Math.floor(npt/2)-1;

ut.setYVal(x=>fck(x-n0)-Math.floor(height/2))
ut.col(col)
ut.redraw();
}
//plotcurve(H1,"red");
//plotcurve(x=>3*H2Right(x/3),"red");
//plotcurve(x=>3*H2Left((x-3)/3),"green");
//plotcurve(x=>5*(H1(x)-1/2*H2Right(x)-1/2*H2Left(x-1)),"green")
//  var u1 = new curve()
// //// u1.setYVal(c12,true)
// //u1.setYVal(x=>Eta(x-10,2,1,1)-10)
// var n0 = Math.floor(npt/2)-1;
// u1.setYVal(x=>-height/2+3*H2Left((x-n0)/3)+3*H2Right((x-n0)/3+1)+3*H1((x-n0)/3))
// //elt.moveY(height/2-H1((elt.x-n0)/2))
// u1.redraw();
// var u0 = new curve()
// //// u1.setYVal(c12,true)
// //u1.setYVal(x=>Eta(x-10,2,1,1)-10)
// var n0 = Math.floor(npt/2)-1;
// u0.setYVal(x=>-Math.floor(height/2)-3*H2Left((x-n0)/3))
// //elt.moveY(height/2-H1((elt.x-n0)/2))
// u0.redraw();
// var u2 = new curve()
// u2.setYVal(x=>-height/2-3*H1((x-n0)/3))
// // // u2.setYVal(t12,true)
// // u2.setYVal(x=>Phi1(x-10)-10)
// u2.redraw();
// //
// var u3 = new curve()
// u3.setYVal(x=>-height/2-3*H1((x-n0)/3)+H2Left((x-n0)/3)+H2Right((x-n0)/3+1))
// u3.redraw();

function testcoeff(f){
var cc = [0];
var ct = [0];
for(var i = 1;i<Math.floor(f.length/2);i++){
  ct.push(2*f[2*(i-1)+1]-2*cc[i-1]-ct[i-1])
  cc.push(f[2*(i-1)+2]-ct[i])
}
return([cc,ct])
}

function testcoeff2(f){
var cc = [0];
var ct = [0];
for(var i = 1;i<Math.floor(f.length/2);i++){

  cc.push(4*f[2*i]-2*ct[i-1]-cc[i-1])
  ct.push(4*f[2*i+1]-ct[i-1]-2*cc[i])
}
return([cc,ct])
}

//remplace dans un str les expressions latex
function Latex(str){
  var stra = str.split("$")
  var ans = ""
  for(var i=0;i<stra.length;i++){
    if(Math.floor(i/2) == i/2){
      ans+=stra[i]
    }
    else{
      ans+= "<img class='latex' src=\"./images/"+stra[i]+".png\">"
    }
  }
  return(ans)
}

function Approx(nbre,dx){
  if(dx>1){
    ;
    return(Math.floor(nbre/dx)*dx);
  }
  else{
    var r = Math.floor(nbre/dx);
    var n = parseInt(1/dx);
    r = parseInt(r);
    return(r/n);
  }

}

var event = new Event('change');
document.getElementById("SelectOrder").dispatchEvent(event);
