describe('features/GumHandler', function() {
	var gumHandler;
	
	beforeEach(function() {
	    module("app");
	    inject(function(GumHandlers) {
	    	gumHandler = GumHandlers;
	    });
	});

	describe(".gotStream", function() {
		var camvideo, stream, createObjectURLSpy, OUTPUT_URL;
		beforeEach(function() {
			OUTPUT_URL = "my url";
			camvideo = {};
	  		stream = {
	  			stop: jasmine.createSpy("streamStop")
	  		};

	  		createObjectURLSpy = spyOn(window.URL, 'createObjectURL').andReturn(OUTPUT_URL);

	  		gumHandler.gotStream(camvideo, stream);
		});

		it("is a function", function() {
			expect(angular.isFunction(gumHandler.gotStream));
		});

		
		it("it calls window.URL.createObjectURL with the provided stream", function() {
			expect(createObjectURLSpy).toHaveBeenCalledWith(stream);
		});

		it("sets camvideo.src to the value of that URL", function() {
			expect(camvideo.src).toBe(OUTPUT_URL);
		});

		describe('sets camvideo.onerror to be a function', function() {
			it('is a function', function() {
				expect(angular.isFunction(camvideo.onerror));
			})

			it('which, when called, calls stop() on the stream', function() {
				camvideo.onerror();
				expect(stream.stop).toHaveBeenCalled();
			})				
		});

		it('sets stream.onended to the function noStream', function() {
			expect(stream.onended).toBe(gumHandler.noStream);
		});
	});

	describe('.nostream', function() {
		var e, getElementSpy, element;

		beforeEach(function() {
			e = {};
			element = {};
			getElementSpy = spyOn(document, 'getElementById').andReturn(element);
		});

		it('is a function', function() {
			expect(angular.isFunction(gumHandler.nostream));
		});

		describe('when e.code is 1', function() {
			var MESSAGE = "User denied access to use camera.";
			it('sets the text of #messageError to ' + MESSAGE, function() {
				e.code = 1;
				expect(element.textContent).not.toBe(MESSAGE);
				gumHandler.noStream(e);
				expect(element.textContent).toBe(MESSAGE);
			});
		});

		describe("when e.code is literally anything else", function() {
			var MESSAGE = "No camera available.";

			it('sets the text of #messageError to ' + MESSAGE, function() {
				e.code = 'literally anything else';
				gumHandler.noStream(e);
				expect(element.textContent).toBe(MESSAGE);
			});
		});
	});
});








