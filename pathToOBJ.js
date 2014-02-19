#target Photoshop
main();
function main()
{
	if(!documents.length) return;
	try
	{
      
        if ( saveFile(PathsToObj (app.activeDocument.pathItems.getByName ( "Work Path" ))))
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

function saveFile(txt) //Savee OBJ to disk. this requires the PSD to already be saved. OBJ file gets saved next to PSD.
{
    var Name = app.activeDocument.name.replace(/\.[^\.]+$/, '');
    var Ext = decodeURI(app.activeDocument.name).replace(/^.*\./,'');
    if (Ext.toLowerCase() != 'psd')
        return false;

    var Path = app.activeDocument.path;
    var saveFile = File(Path + "/" + Name +".obj");

    if(saveFile.exists)
        saveFile.remove();

    saveFile.encoding = "UTF8";
    saveFile.open("e", "TEXT", "????");
    saveFile.writeln(txt);
    saveFile.close();
    return true;
}