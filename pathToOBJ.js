#target Photoshop
main();
function main()
{
	if(!documents.length) return;
	try
	{
         var imagewidth = activeDocument.width.as('px');
         var imageheight = activeDocument.height.as('px');              //  image width and height used in normalization 
		var Info = '';
         var stream ="";
		var workPath = app.activeDocument.pathItems.getByName("Path 1");
        
         
         var count = 0;
         var pointCache = 0;
  
        
		for(var b =0; b < workPath.subPathItems.length; b++)
		{
            
         var verts = "";
         var normals = "";
         var uvs = "";
         var  triangles = "f ";
         var cache = workPath.subPathItems[b].pathPoints.length;

            for (var p = 0; p < workPath.subPathItems[b].pathPoints.length; p++)
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
 
        saveFile(stream);

	}

	catch(e)
	{
		alert(e);
	}

}


function saveFile(txt)
{
    var Name = app.activeDocument.name.replace(/\.[^\.]+$/, '');
    var Ext = decodeURI(app.activeDocument.name).replace(/^.*\./,'');
    if (Ext.toLowerCase() != 'psd')
        return;

    var Path = app.activeDocument.path;
    var saveFile = File(Path + "/" + Name +".obj");

    if(saveFile.exists)
        saveFile.remove();

    saveFile.encoding = "UTF8";
    saveFile.open("e", "TEXT", "????");
    saveFile.writeln(txt);
    saveFile.close();
    alert ("File Saved To: " + saveFile)
}