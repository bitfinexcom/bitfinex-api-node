require 'middleman-gh-pages'
require 'rake/clean'

desc "grabs coverage report that was generated on the master branch"
task :add_coverage_report do
  puts "I AM ADDING THE COVERAGE REPORT"
  sh "git checkout master -- source/images/coverage/lcov.info"
  sh "git checkout master -- source/images/coverage/coverage.json"
  sh "git checkout master -- source/images/coverage/lcov-report/index.html"
  sh "git checkout master -- source/images/coverage/lcov-report/bitfinex-api-node/index.html"
  sh "git checkout master -- source/images/coverage/lcov-report/bitfinex-api-node/index.js.html"
  sh "git checkout master -- source/images/coverage/lcov-report/bitfinex-api-node/rest.js.html"
  sh "git checkout master -- source/images/coverage/lcov-report/bitfinex-api-node/ws.js.html"
  sh "git status"
  sh "git add --all"
  if /nothing to commit/ =~ `git status`
    puts "No changes to commit."
  else
    sh "git commit -m 'added coverage_report'"
    sh "git push"
  end
end

CLOBBER.include('build')

task :publish => [:add_coverage_report]
