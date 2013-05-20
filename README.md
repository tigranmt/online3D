###Online3D: web 3D view and share platform  
========

####What is it for ? 

The platform idea is to provide comprehensive set of functionalities for sharing and validating 3D files 
between users. With the aggressive addvancement of 3D technology like 3D printing, modelling, sculpturing and 
successive sharing to a final user for preventive validation, we need simple and streighforward platforms were
final users, which are very often in these cases are not engineers, can easily revise and accept models. 


####The are other solutions are available online. What is different here ? What is good for ? 

Yes, there are several platforms available now in the market like: 

-[3dfile.io/](http://3dfile.io/)
-[SketchFab](https://sketchfab.com/)
-[GrabCAD](http://grabcad.com/)


The [3dfile.io/](http://3dfile.io/) and [SketchFab](https://sketchfab.com/) when one want to upload a file, first 
it will be sent to a server, converted and after visualized to you. 


The [GrabCAD](http://grabcad.com/)  use the same techniques, but provides also fairly complex 3D model revision 
infrustruture. At this moment it's in betta, so I have't a chance to stufy it: 
[GrabCad Workbench](http://grabcad.com/workbench)


Online3D provides 

+ Client side user's model loading and visualization: why send something to the server, 
  if I yet have to visualize it ? 

+ No limits for data upload and load

+ Smooth integration with DropBox. Don't like built-in server support ? Put your models in DropBox "Public" folder, 
  and load them directly from the application. 

+ Partial coloring of the model's surface which persist in the session 

+ Annotations: can add notes and assign points on the models to them 

+ Automated email notifications to specified email addresses after session upload, so the user
  will need only to click a link in recieved mail in order to revise models. 



####What formats does support Online3D. 

For now the only supported format is [STL format](http://en.wikipedia.org/wiki/STL_(file_format))


####So what next  ? 

- Custom session support format ".online3d": don't want to use builtin server support, or like a free stuff ? 
  It's ok save all session (models, annotations, coloring) into single JSON file and upload to your DropBox account.
  From Online3D just choose that file and all information will be reloaded directly into the browser. 

- More formats: PLY, OBJ (with texturing support) 

- And much much more....






