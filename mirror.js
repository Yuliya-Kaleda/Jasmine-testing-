describe("features/mirror", function() {
	var MOCK_GUM_HANDLERS, gumSpy, mockElement, mockBoundFunction1, mockBoundFunction2, mockMonitor, subject, OUTPUT_URL;
	beforeEach(function() {
		mockBoundFunction1 = function() {};
		mockBoundFunction2 = function() {};
		OUTPUT_URL = "my url";

		gumSpy = spyOn(navigator, 'webkitGetUserMedia').andCallThrough();
		urlSpy = spyOn(window.URL, 'createObjectURL').andReturn(OUTPUT_URL);

		mockMonitor = {};

		mockElement = {
			children: jasmine.createSpy('mockElement.children').andReturn([mockMonitor])
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

	it('calls window.URL', function(){
		expect(urlSpy).toHaveBeenCalled();
	})

});