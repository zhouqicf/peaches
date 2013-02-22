MOCHA_OPTS=
REPORTER = dot

check: test

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov: clean lib-cov
	@PEACHES_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html && $(MAKE) cleanTemp
lib-cov:
	@jscoverage lib lib-cov

benchmark:
	@./support/bench

cleanTemp:
	echo cleanTemp
	rm -rf lib-cov
	rm -rf download

clean: cleanTemp
	rm -f coverage.html


.PHONY: test test-unit test-acceptance benchmark clean
