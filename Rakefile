require 'middleman-gh-pages'
require 'rake/clean'

desc "grabs coverage report that was generated on the master branch"
task :add_coverage_report do
  puts "I AM ADDING THE COVERAGE REPORT"
  sh "git checkout master -- source/images/coverage/"
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
