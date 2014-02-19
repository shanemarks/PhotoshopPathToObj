﻿#target Photoshop
main();
function main()
{
	if(!documents.length) return;
	try
	{
      
        doc = app.activeDocument; //reference to the active document
        layer = doc.activeLayer; //reference to currently active layer

        
        if ( saveFile(PathsToObj (doc.pathItems.getByName ( "Work Path" ))))
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

function saveFile(txt)                                  //Save OBJ to disk. this requires the PSD to already be saved. OBJ file gets saved next to PSD.
{
        var Name = app.activeDocument.name.replace(/\.[^\.]+$/, '');
        var Ext = decodeURI(app.activeDocument.name).replace(/^.*\./,'');
        if (Ext.toLowerCase() != 'psd')             //Only work with photoshop files
        {
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


function ActiveLayerToWorkPath (layer)  // STILL TO DO
{
            SelectTransparency (layer.name);
}


function SelectTransparency( layerName ){  // THIS FUNCTION IS NOT WORKING
     try{
          var desc = new ActionDescriptor();
               var ref = new ActionReference();
               ref.putEnumerated( charIDToTypeID( "Chnl" ), charIDToTypeID( "Chnl" ), charIDToTypeID( "Trsp" ) );
               ref.putName( charIDToTypeID( "Lyr " ), layerName );
          desc.putReference( charIDToTypeID( "null" ), ref );
               var ref1 = new ActionReference();
               ref1.putProperty( charIDToTypeID( "Chnl" ), charIDToTypeID( "fsel" ) );
          desc.putReference( charIDToTypeID( "T   " ), ref1 );
          executeAction( charIDToTypeID( "setd" ), desc, DialogModes.NO );
          return true;
          return true;
     }catch(e){alert (e);}
     return false;
}

