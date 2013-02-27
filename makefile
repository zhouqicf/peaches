MOCHA_OPTS=
REPORTER = dot

check: test

## 默认使用云端
test: test-local


test-local:
	@TEST_MODE=local ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cloud:
	@TEST_MODE=cloud ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

## windows 下测试。需要：ftp://ftp.equation.com/make/32/make.exe
test-win:
	node .\node_modules\mocha\bin\mocha

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
