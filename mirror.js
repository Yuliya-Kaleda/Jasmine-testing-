describe("features/mirror", function() {
	var MOCK_GUM_HANDLERS, gumSpy, mockElement, mockVideoContext, mockVideoCanvas, mockBoundFunction1, mockBoundFunction2, mockMonitor, subject;
	beforeEach(function() {
		mockBoundFunction1 = function() {};
		mockBoundFunction2 = function() {};

		gumSpy = spyOn(navigator, 'webkitGetUserMedia').andCallThrough();

		mockMonitor = {};

		mockVideoContext = {
			translate: jasmine.createSpy('mockVideoContext.translate'),
			scale: jasmine.createSpy('mockVideoContext.scale'),
			font: jasmine.createSpy('mockVideoContext.font'),
			fillStyle: jasmine.createSpy('mockVideoContext.fillStyle'),
			fillRect: jasmine.createSpy('mockVideoContext.fillRect')
		};

		mockVideoCanvas = {
			getContext: jasmine.createSpy('mockVideoCanvas.getContext').andCallThrough().andReturn(mockVideoContext),
		};

		mockElement = {
			children: jasmine.createSpy('mockElement.children').andReturn([mockMonitor]),
			find: jasmine.createSpy('mockElemnt.find').andCallThrough().andReturn([mockVideoCanvas])
		};

		MOCK_GUM_HANDLERS = {
			gotStream: {
				bind: jasmine.createSpy('gotstreamspy').andReturn(mockBoundFunction1)
			},
			noStream: mockBoundFunction2
		};

		module("app", function($provide) {
			$provide.value('GumHandlers', MOCK_GUM_HANDLERS);
		});

		inject(function(MirrorLink) {
			subject = MirrorLink;
		});
	});

	it('is a function', function(){
		expect(angular.isFunction(subject));
	});

	it('works', function() {
		subject({}, mockElement);
		expect(gumSpy).toHaveBeenCalled();
	});
	
	describe("calls mockElement.find", function(){
        
        it('which is a function', function(){
        	subject({}, mockElement);
            expect(mockElement.find).toEqual(jasmine.any(Function));
        });
    });

    describe("calls navigator.getUserMedia", function(){
    
        it('which is a function', function(){
            expect(angular.isFunction(navigator.getUserMedia));
        });

        it('and has 3 arguments', function() {
            navigator.getUserMedia.reset();
            expect(navigator.getUserMedia).not.toHaveBeenCalledWith(jasmine.objectContaining({video: true}), jasmine.any(Function), jasmine.any(Function));

            subject({}, mockElement);
            expect(navigator.getUserMedia).toHaveBeenCalledWith(jasmine.objectContaining({video: true}), jasmine.any(Function), jasmine.any(Function));
        });

        it('and has an argument that calls bind on gotStream', function(){
        	subject({}, mockElement);
            expect(MOCK_GUM_HANDLERS.gotStream.bind).toHaveBeenCalledWith(null, {});
        });
    });
});
