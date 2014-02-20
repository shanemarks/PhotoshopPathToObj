/*
    Author: Shane Marks
    Description: General tool to create  obj's from photoshop layers either from paths OR automatically from layer transparency.
    
    Current Usage:  Select layer and run script
    
*/



#target Photoshop
var cachedLength =  0; //variable to start the catched length  the path
main();
function main()
{
	if(!documents.length) return;
    var startRulerUnits =  app.preferences.rulerUnits;
    var startTypeUnits = app.preferences.typeUnits; 
    var startDisplayDialogs = app.displayDialogs;

    StandardiseUnits ();    //adjust photoshop settings temporarily to make sure they work with the script, as certain functions are unit-dependant.
    
	try
	{
      
        doc = app.activeDocument; //reference to the active document
        layer = doc.activeLayer; //reference to currently active layer

        SamplePaths (ActiveLayerToWorkPath(layer, 20 ),  4  ,5000);



        if ( saveFile(PathsToObj (doc.pathItems.getByName ( "pathOMatic" ))))
        {
            alert ("File saved Successfully");
        }

        else
        {
            alert ("File failed to save");
        }

	}

	catch(e)
	{
		alert(e);
	}

    ResetUnits (startRulerUnits, startTypeUnits, startDisplayDialogs);
    
}



function StandardiseUnits()
{
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.PIXELS;
    app.displayDialogs = DialogModes.NO;
}

function ResetUnits (r, t, d)
{
    app.preferences.rulerUnits = r;
    app.preferences.typeUnits = t;
    app.displayDialogs = d;
}


// This function takes in a given set of paths and converts the information to a poly mesh (OBJ format). Uv's are also generated
function PathsToObj (workPath)
{

        var imagewidth = activeDocument.width.as('px');                
        var imageheight = activeDocument.height.as('px');                   //image width and height used in normalization 
        var stream =""; 
        var count = 0;                                                     
        var pointCache = 0;                                                 //stores cache of amount of points counted, used in OBJ generation
  
        
        for(var b =0; b < workPath.subPathItems.length; b++)                //loop though each path segment
        {
            
            var verts = "";
            var normals = "";
            var uvs = "";
            var triangles = "f ";
            var cache = workPath.subPathItems[b].pathPoints.length;

            for (var p = 0; p < workPath.subPathItems[b].pathPoints.length; p++) //loop through each point in path
            {
                verts += "v " +(workPath.subPathItems[b].pathPoints[p].anchor[0]) + " " + (imageheight - workPath.subPathItems[b].pathPoints[p].anchor[1]) + " 0\r" ;              
                normals += "vn  0 0 1\r"  ;
                uvs += "vt "  + (workPath.subPathItems[b].pathPoints[p].anchor[0] / imagewidth ) + " " + (1 - (workPath.subPathItems[b].pathPoints[p].anchor[1] / imageheight)) + "\r";
                count = (cache - p + pointCache);
                triangles += count+"/"+count +"/"+count +" ";
            }
            pointCache +=cache;
            stream += verts + normals + uvs + triangles + "\r";
        }
 
    return stream;
}


  //Save OBJ to disk. this requires the PSD to already be saved. OBJ file gets saved next to PSD.
function saveFile(txt)                                
{
        var Name = app.activeDocument.name.replace(/\.[^\.]+$/, '');
        var Ext = decodeURI(app.activeDocument.name).replace(/^.*\./,'');
        if (Ext.toLowerCase() != 'psd')             //Only work with photoshop files
        {
            throw  "Error:  File must be saved as a PSD";
            return false;
        }
    
        var Path = app.activeDocument.path;
        var saveFile = File(Path + "/" + Name +".obj");

        if(saveFile.exists)
        {
            saveFile.remove();
        }
    
        saveFile.encoding = "UTF8";
        saveFile.open("e", "TEXT", "????");
        saveFile.writeln(txt);
        saveFile.close();

        return true;
}


function ActiveLayerToWorkPath (layer, proximityRadius)  
{
           app.activeDocument.selection.deselect (); 
           if (SelectTransparency (layer.name))
           {
                app.activeDocument.selection.expand (proximityRadius);
                app.activeDocument.selection.makeWorkPath();
           }
           return doc.pathItems.getByName ( "Work Path" ).subPathItems;
       
            
}

// Helper function to create selection from  layer transparency
function SelectTransparency( layerName )    
{ 
      var desc13 = new ActionDescriptor();
      var ref10 = new ActionReference();
      ref10.putProperty( charIDToTypeID('Chnl'), charIDToTypeID('fsel') );
      desc13.putReference( charIDToTypeID('null'), ref10 );
      var ref11 = new ActionReference();
      ref11.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Trsp') );
      ref11.putName( charIDToTypeID('Lyr '), activeDocument.artLayers[0].name );
      desc13.putReference( charIDToTypeID('T   '), ref11 );
      try
      {
            executeAction( charIDToTypeID('setd'), desc13, DialogModes.NO );
            return true;
      }
      catch (e) 
      {
          alert(e);
          return false;
      }
}

function SamplePaths (paths, sampleRate, distanceTolerance)
{
    
    var sample = 1 /sampleRate; // TO DO: Normalize by segment length to make sure all segments have equal points.

    var pathsList = new Array (); // store list of points for each path after sampling
    for (var i = 0; i < paths.length; i ++) // iterate through each path group
    {

     var pointList  = new Array (); //store list of each point in path after sampling;
     var c = 0;
     var length = paths[i].pathPoints.length-1;
        for (var p = 0; p < length; p ++) //iterate through each point on the curve
        {

            var t =0;

                        
            if (ShouldWeInterpolate (paths[i].pathPoints[p].anchor, paths[i].pathPoints[p].leftDirection,paths[i].pathPoints[p+1].rightDirection,paths[i].pathPoints[p+1].anchor, distanceTolerance, 0.1))
             {  
      
                while (t < 1)
                {
                        var point = new PathPointInfo;
                        point.kind = PointKind.CORNERPOINT;
                       
                        point.anchor =  Array (CalculateBezierPoint (t, paths[i].pathPoints[p].anchor[0], paths[i].pathPoints[p].leftDirection[0],paths[i].pathPoints[p+1].rightDirection[0],paths[i].pathPoints[p+1].anchor[0]), 
                                                CalculateBezierPoint (t, paths[i].pathPoints[p].anchor[1], paths[i].pathPoints[p].leftDirection[1],paths[i].pathPoints[p+1].rightDirection[1],paths[i].pathPoints[p+1].anchor[1]));
                        point.leftDirection = point.anchor;
                        point.rightDirection = point.anchor;
                        
                        pointList[c] = point;
                        t += sample;
                        c++;
       
                     
                }   //end while
            }// end distance change
            else // if fail use points as is.
            {
                pointList[c]= new PathPointInfo;
                pointList.kind = PointKind.CORNERPOINT;

                pointList[c].anchor = paths[i].pathPoints[p].anchor;
                pointList[c].leftDirection = paths[i].pathPoints[p].anchor;
                pointList[c].rightDirection = paths[i].pathPoints[p].anchor;
                c++;
                pointList.kind = PointKind.CORNERPOINT;
                pointList[c]= new PathPointInfo;
                pointList[c].anchor = paths[i].pathPoints[p+1].anchor;
                pointList[c].leftDirection = paths[i].pathPoints[p+1].anchor;
                pointList[c].rightDirection = paths[i].pathPoints[p+1].anchor;
            }
        } // end iterate through points
        
        pathsList[i] = new SubPathInfo ();
        pathsList[i].operation =ShapeOperation.SHAPEXOR;
        pathsList[i].closed = true;
        pathsList[i].entireSubPath  = pointList;
       
    }

        app.activeDocument.pathItems.add ("pathOMatic",pathsList);
      

}

function CalculateBezierPoint  (t, p0, p1, p2, p3)
{
    var u = 1 - t;
    var tt = t*t;
    var uu =u*u;
    var uuu = uu*u;
    var ttt = tt*t;

    var p = uuu*p0;
    p += 3 * uu * t * p1; //second term
    p += 3 * u * tt * p2; //third term
    p += ttt * p3; //fourth term

    return p;
}


function ShouldWeInterpolate (p0,p1,p2,p3 , distance,angle)
    {
        // length threshold calculation
        var d =  (Math.pow (p1[0]-p0[0],2) +  Math.pow (p1[1]-p0[1],2))+
       (Math.pow (p2[0]-p1[0],2) +  Math.pow (p2[1]-p1[1],2))+
       (Math.pow (p3[0]-p2[0],2) +  Math.pow (p3[1]-p2[1],2));
        cachedLength;
       
        //angle threshold i
        var deltaX = p1[0]-p0[0];
        var deltaY = p1[1]-p0[1];
        var angle1 =Math.abs (Math.atan(deltaX/deltaY));

        var deltaX = p2[0]-p1[0];
        var deltaY = p2[1]-p1[1];
        var angle2 = Math.abs (Math.atan(deltaX/deltaY));
       
        var a =  Math.abs (angle2 - angle1);
        
        if (d > distance && a>angle)
        {
            return true;
        }
    
        else
        {
            return false;
        }
       
    }

function CalculateAngleDifference (p0,p1,p2,pe)
{

}