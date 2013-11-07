specs := $(shell find ./test -name '*.test.js' ! -path "*node_modules/*")
reporter = spec
opts =
test:
	@node_modules/.bin/mocha --reporter ${reporter} ${opts} ${specs}


lint:
	@node_modules/.bin/jshint lib/client.js lib/scp.js index.js bin/scp2

out = _site/coverage.html
coverage:
	@rm -fr lib-cov
	@jscoverage lib lib-cov
	@NICO_COVERAGE=1 $(MAKE) test reporter=html-cov > ${out}
	@echo
	@rm -fr lib-cov
	@echo "Built Report to ${out}"
	@echo

clean:
	@rm -fr _site

.PHONY: build test lint coverage
