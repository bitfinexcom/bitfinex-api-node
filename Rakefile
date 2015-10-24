require 'middleman-gh-pages'
require 'rake/clean'

desc "grabs coverage report that was generated on the master branch"
task :add_coverage_report do
  sh "git checkout master -- source/images/coverage"
  sh "git commit -m 'added coverage_report'"
  sh "git push"
end

CLOBBER.include('add_coverage_report')
CLOBBER.include('build')

task :default => [:add_coverage_report]
