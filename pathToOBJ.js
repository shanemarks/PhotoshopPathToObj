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

     //       try
    //        {

                        doc = app.activeDocument; //reference to the active document
                        layer = doc.activeLayer; //reference to currently active layer

                        SamplePaths (ActiveLayerToWorkPath(layer, 25 ),  100  ,100);



            if ( saveFile(PathsToObj (doc.pathItems.getByName ( "pathOMatic" ))))
            {
                        alert ("File saved Successfully");
            }

            else
            {
                        alert ("File failed to save");
            }

         //   }

    //        catch(e)
    //        {
       //                 alert(e);
      //      }

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
                        // var start = new Date().getTime();
                        var verts = "";
                        var normals = "";
                        var uvs = "";
                        var triangles = "f ";
                        var cache = workPath.subPathItems[b].pathPoints.length;
                        var thePoints =  workPath.subPathItems[b].pathPoints;
                        for (var p = 0; p < thePoints.length; p++) //loop through each point in path
                        {
                                    var thePoint = thePoints[p]
                                    verts += "v " +(thePoint.anchor[0]) + " " + (imageheight - thePoint.anchor[1]) + " 0\r" ;              
                                    normals += "vn  0 0 1\r"  ;
                                    uvs += "vt "  + (thePoint.anchor[0] / imagewidth ) + " " + (1 - (thePoint.anchor[1] / imageheight)) + "\r";
                                    count = (cache - p + pointCache);
                                    triangles += count+"/"+count +"/"+count +" ";
                        }
                        pointCache +=cache;
                        stream += verts + normals + uvs + triangles + "\r";

                        //var end = new Date().getTime();
                        //var time = end - start;
                        //alert('Execution time: ' + time);           
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

            var pathsList = new Array (); // store list of points for each path after sampling
            var lp = paths.length;

            var thePath;
            var pathLength = 0;  // length of all paths combined
            for (var i =0; i<lp;i++)
            {
                                               pathLength +=CalculatePathLength(paths[i].pathPoints);
             }
 
            for (var i = 0; i < lp; i ++) // iterate through each path group
            {
                        var pointList  = new Array (); //store list of each point in path after sampling;
                        var c = 0;
                        var length = paths[i].pathPoints.length-1;
                        var point;
                        thePath = paths[i];
                        for (var p = 0; p < length; p ++) //iterate through each point on the curve
                        {

                      
                        var thePoint = thePath.pathPoints[p]; 
                        var theNextPoint = thePath.pathPoints[p+1];  //caching these references signfinicately improves running time of script.
                        ShouldWeInterpolate (thePoint.anchor, thePoint.leftDirection,theNextPoint.rightDirection,theNextPoint.anchor, distanceTolerance, 0.1)
                        segmentPercent = pathLength / cachedLength;
                        sample = (1 / sampleRate*segmentPercent);
                        t =0;

                        while (t < 1)
                                    {
                                                
                                    point = new PathPointInfo;
                                    point.kind = PointKind.CORNERPOINT;

                                    point.anchor =  CalculateBezierPoint (t, thePoint.anchor, thePoint.leftDirection,theNextPoint.rightDirection,theNextPoint.anchor);

                                    point.leftDirection = point.anchor;
                                    point.rightDirection = point.anchor;

                            
                                        pointList[c] = point;
                                        c++;
                                    
                                    t += sample;


                                    }   //end while
                        
                        } // end iterate through points

                         var thePoint = thePath.pathPoints[length]; 
                        var theNextPoint = thePath.pathPoints[0];  //caching these references signfinicately improves running time of script.                point = new PathPointInfo;
                        point.kind = PointKind.CORNERPOINT;
                                    
                         ShouldWeInterpolate (thePoint.anchor, thePoint.leftDirection,theNextPoint.rightDirection,theNextPoint.anchor, distanceTolerance, 0.1)
                        segmentPercent = pathLength / cachedLength;
                        sample = (1 / sampleRate*segmentPercent);
                        t =0;

                        while (t < 1)
                                    {
                                                
                                    point = new PathPointInfo;
                                    point.kind = PointKind.CORNERPOINT;

                                    point.anchor =  CalculateBezierPoint (t, thePoint.anchor, thePoint.leftDirection,theNextPoint.rightDirection,theNextPoint.anchor);

                                    point.leftDirection = point.anchor;
                                    point.rightDirection = point.anchor;

                            
                                  pointList[c] = point;
                                   c++;
                                    
                                    t += sample;


                                    }   //end while
                        
                        pathsList[i] = new SubPathInfo ();
                        pathsList[i].operation =ShapeOperation.SHAPEXOR;
                        pathsList[i].closed = true;
                        pathsList[i].entireSubPath  = Optimize (pointList);

            }
                        
            app.activeDocument.pathItems.add ("pathOMatic",pathsList);


}

function Optimize(pointList)
{
            var length = pointList.length -1;
            var newList = Array ();
 
            var lc = 0;
            for (var i = 0 ; i < length; i++)
            {
                       var pass = false
                       var counter = 1;
                       newList[lc] = pointList[i];
                       var thePoint = pointList[i];
              
                       while (!pass)
                       {
                                    var theNextPoint =  pointList[i+counter];
                                    if (i+counter <=length)
                                    {

                                                if (SegmentLength (thePoint.anchor, theNextPoint.anchor) > 30)
                                                {
                                         
                                            //     newList[lc] = pointList[i+counter];
                                                 pass = true;
                                                 i += counter-1;
                                                 lc++;
                                        
                                                }
                                                else
                                                {
                                                            counter++;
                                                            
                                                }
                                    }
                                     else
                                     {
                                                 pass=true;
                                     }
                        }
            }

            return newList;
}

function CalculateBezierPoint  (t, p0, p1, p2, p3)
{
            var out = Array ();
            var u = 1 - t;
            var tt = t*t;
            var uu =u*u;
            var uuu = uu*u;
            var ttt = tt*t;

            out[0] = uuu*p0[0];
            out[0] += 3 * uu * t * p1[0]; //second term
            out[0] += 3 * u * tt * p2[0]; //third term
            out[0] += ttt * p3[0]; //fourth term


            out[1] = uuu*p0[1];
            out[1] += 3 * uu * t * p1[1]; //second term
            out[1] += 3 * u * tt * p2[1]; //third term
            out[1] += ttt * p3[1]; //fourth term


            return out;
}


function ShouldWeInterpolate (p0,p1,p2,p3 , distance,angle)
    {
        // length threshold calculation
            cachedLength =   Math.sqrt (Math.pow (p1[0]-p0[0],2) +  Math.pow (p1[1]-p0[1],2))+
            Math.sqrt (Math.pow (p2[0]-p1[0],2) +  Math.pow (p2[1]-p1[1],2))+
            Math.sqrt(Math.pow (p3[0]-p2[0],2) +  Math.pow (p3[1]-p2[1],2));

            //angle threshold i
            var deltaX = p1[0]-p0[0];
            var deltaY = p1[1]-p0[1];
            var angle1 =Math.abs (Math.atan(deltaX/deltaY));

            var deltaX = p2[0]-p1[0];
            var deltaY = p2[1]-p1[1];
            var angle2 = Math.abs (Math.atan(deltaX/deltaY));

            var a =  Math.abs (angle2 - angle1);

            if (cachedLength > distance && a>angle)
            {
                        return true;
            }

            else
            {
                        return false;
            }
       
    }
function SegmentLength (p0,p1)
{
            return Math.sqrt (Math.pow (p1[0]-p0[0],2) +  Math.pow (p1[1]-p0[1],2));
            }
function CalculatePathLength (pathPoints)
{
            var length = 0;
            for (var p = 0; p < pathPoints.length-1; p ++) //iterate through each point on the curve
            {
            var t =0;
             var p0 = pathPoints[p].anchor; 
             var p1 = pathPoints[p].leftDirection;
             var p2 = pathPoints[p+1].rightDirection;
             var p3 = pathPoints[p+1].anchor;

            length +=    Math.sqrt (Math.pow (p1[0]-p0[0],2) +  Math.pow (p1[1]-p0[1],2))+
            Math.sqrt (Math.pow (p2[0]-p1[0],2) +  Math.pow (p2[1]-p1[1],2))+
            Math.sqrt(Math.pow (p3[0]-p2[0],2) +  Math.pow (p3[1]-p2[1],2));
            }
            return length;
   
}

function CalculateAngle (p0,p1,p2,p3)
{
        var deltaX = p1[0]-p0[0];
        var deltaY = p1[1]-p0[1];
        var angle1 =Math.abs (Math.atan(deltaX/deltaY));

        var deltaX = p2[0]-p1[0];
        var deltaY = p2[1]-p1[1];
        var angle2 = Math.abs (Math.atan(deltaX/deltaY));
       
        return Math.abs (angle2 - angle1);
 }
