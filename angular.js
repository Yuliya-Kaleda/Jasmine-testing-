console.log("THIS JAVASCRIPT FILE WAS INCLUDED!");

app.directive('mirror', function(MirrorLink, mirrorTemplateUrl) {
	return {
		restrict: "E",
		replace: true,
		link: MirrorLink,
		templateUrl: mirrorTemplateUrl
	};
});

app.value('mirrorTemplateUrl', 'mirror.html');

app.service("MirrorLink", function(GumHandlers, animateFunction) {
	var element = $(element);

	return function(scope, element, attributes, parent) {
		console.log("Mirror linking function initialized!");
		
		//element = $(element);

		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		window.URL = window.URL || window.webkitURL;
		
		var camvideo = element.children("#monitor")[0];

		if (!navigator.getUserMedia) {
			document.getElementById('messageError').innerHTML = 
				'Sorry. <code>navigator.getUserMedia()</code> is not available.';
		}
		
		navigator.getUserMedia({video: true}, GumHandlers.gotStream.bind(null, camvideo), GumHandlers.noStream);		

		/* The code below contains a loop to draw the contents of the video tag onto the canvas tag, enabling us to do cool things with the image. */

		// var video = element.children('#monitor')[0];
		var videoCanvas = element.find( '#videoCanvas' )[0];
		var videoContext = videoCanvas.getContext( '2d' );

		var layer2Canvas = element.find( '#layer2' )[0];
		var layer2Context = layer2Canvas.getContext( '2d' );

		var blendCanvas  = element.find("#blendCanvas" )[0];
		var blendContext = blendCanvas.getContext('2d');

		videoContext.translate(1080, 0);
		videoContext.scale(-1, 1);

		// //text on video
		layer2Context.font = "80px Helvetiker";
		layer2Context.fillText("WE LOVE MTA =)",430,100);
				
		// background color if no video present
		videoContext.fillStyle = '#000000';
		videoContext.fillRect( 0, 0, videoCanvas.width, videoCanvas.height );				

		var buttons = [];

		var button1 = new Image();
		button1.src ="img/redCircle.png";
		var buttonData1 = { name:"red", image:button1, x:320 - 96 - 160, y:40, w:72, h:72 };
		buttons.push( buttonData1 );

		var button2 = new Image();
		button2.src ="img/greenCircle.png";
		var buttonData2 = { name:"green", image:button2, x:320 - 64 - 100, y:40, w:72, h:72 };
		buttons.push( buttonData2 );

		var button3 = new Image();
		button3.src ="img/blueCircle.png";
		var buttonData3 = { name:"blue", image:button3, x:320 - 32-40, y:40, w:72, h:72 };
		buttons.push( buttonData3 );

		animateFunction(camvideo, videoContext, layer2Context, buttons, videoCanvas, blendContext, null);		
	};
});

app.service('computeDifference', function() {
	function differenceAccuracy(target, data1, data2) 
	{
		if (data1.length !== data2.length) 
			{
				return null;
			}
		var i = 0;
		while (i < (data1.length * 0.25)) 
		{
			var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
			var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
			var diff = threshold(fastAbs(average1 - average2));
			target[4*i]   = diff;
			target[4*i+1] = diff;
			target[4*i+2] = diff;
			target[4*i+3] = 0xFF;
			++i;
		}
	}

	function fastAbs(value) 
	{
		return (value ^ (value >> 31)) - (value >> 31);
	}

	function threshold(value) 
	{
		return (value > 0x15) ? 0xFF : 0;
	}

	return differenceAccuracy;
});

app.service('GumHandlers', function() {
	function gotStream(camvideo, stream) {
		camvideo.src = window.URL.createObjectURL(stream);

		camvideo.onerror = function(e) 
		{   stream.stop();   };

		stream.onended = noStream;
	}

	function noStream(e) {
		var msg = 'No camera available.';
		if (e.code === 1) 
		{   msg = 'User denied access to use camera.';   }

		var errorDiv = document.getElementById('messageError');
		if (errorDiv) {
			errorDiv.textContent = msg;
		}
	}

	return {
		gotStream: gotStream,
		noStream: noStream
	};
});

app.service('blendFunction', function(computeDifference) {
	return function blend(videoCanvas, blendContext, lastImageData) {
		var videoContext = videoCanvas.getContext('2d');
		var width  = videoCanvas.width;
		var height = videoCanvas.height;
		// get current webcam image data
		var sourceData = videoContext.getImageData(0, 0, width, height);
		// create an image if the previous image doesn't exist
		if (!lastImageData) 
			{
				lastImageData = videoContext.getImageData(0, 0, width, height);
			}
		// create an ImageData instance to receive the blended result
		var blendedData = videoContext.createImageData(width, height);
		// blend the 2 images
		computeDifference(blendedData.data, sourceData.data, lastImageData.data);
		// draw the result in a canvas
		blendContext.putImageData(blendedData, 0, 0);
		// store the current webcam image
		return sourceData;
	};
});

app.value('renderFunction', function render(camvideo, videoContext, layer2Context, buttons){
	if ( camvideo.readyState === camvideo.HAVE_ENOUGH_DATA ) 
	{
		// mirror video
		videoContext.drawImage( camvideo, 0, 0, videoCanvas.width, videoCanvas.height );
		for ( var i = 0; i < buttons.length; i++ )
		{
			layer2Context.drawImage( buttons[i].image, buttons[i].x, buttons[i].y, buttons[i].w, buttons[i].h );		
		}		
	}
});


// check if white region from blend overlaps area of interest (e.g. triggers)
app.value('checkAreasFunction', function checkAreas(buttons, blendContext, layer2Context){
	for (var b = 0; b < buttons.length; b++)
	{
		// get the pixels in a note area from the blended image
		var blendedData = blendContext.getImageData( buttons[b].x, buttons[b].y, buttons[b].w, buttons[b].h );
			
		// calculate the average lightness of the blended data
		var i = 0;
		var sum = 0;
		var countPixels = blendedData.data.length * 0.25;
		while (i < countPixels) 
		{
			sum += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]);
			++i;
		}
		// calculate an average between of the color values of the note area [0-255]
		var average = Math.round(sum / (3 * countPixels));
		if (average > 50) // more than 20% movement detected
		{
			console.log( "Button " + buttons[b].name + " triggered." ); // do stuff
			if (buttons[b].name === "red") {
				layer2Context.fillStyle = "red";
				layer2Context.font = "80px Helvetiker";
				layer2Context.fillText("WE LOVE MTA =)",430,100);	
			}
			if (buttons[b].name === "green") {
				layer2Context.fillStyle = "green";
				layer2Context.font = "80px Helvetiker";
				layer2Context.fillText("WE LOVE MTA =)",430,100);
			}
			if (buttons[b].name === "blue") {
				layer2Context.fillStyle = "blue";
				layer2Context.font = "80px Helvetiker";
				layer2Context.fillText("WE LOVE MTA =)",430,100);
			}
		}
	}
});

app.service('animateFunction', function (renderFunction, blendFunction, checkAreasFunction){
	var lastImageData, renderObject, blendedImage;

	function animate(camvideo, videoContext, layer2Context, buttons, videoCanvas, blendContext, lastImageData) {
		renderFunction(camvideo, videoContext, layer2Context, buttons);
		checkAreasFunction(buttons, blendContext, layer2Context);		
		lastImageData = blendFunction(videoCanvas, blendContext, lastImageData);

		requestAnimationFrame( animate.bind(this, camvideo, videoContext, layer2Context, buttons, videoCanvas, blendContext, lastImageData) );
	}

	return animate;
});
