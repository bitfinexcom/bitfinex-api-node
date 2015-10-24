require 'middleman-gh-pages'
require 'rake/clean'

desc "grabs coverage report that was generated on the master branch"
task :add_coverage_report do
  sh "git checkout master -- source/images/coverage"
  sh "git commit -a -m 'added coverage_report'"
  sh "git push"
end

CLOBBER.include('build')

task :publish => [:add_coverage_report]
