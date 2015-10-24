require 'middleman-gh-pages'
require 'rake/clean'

desc "grabs coverage report that was generated on the master branch"
task :add_coverage_report do
  puts "I AM ADDING THE COVERAGE REPORT"
  sh "git checkout master -- source/images/coverage"
  sh "git commit -a -m 'added coverage_report'"
  sh "git push"
  unless ENV['ALLOW_DIRTY']
    fail "Directory not clean" if /nothing to commit/ !~ `git status`
  end
end

CLOBBER.include('build')

task :publish => [:add_coverage_report]
