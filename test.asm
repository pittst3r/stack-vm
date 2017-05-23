jump :main
:foo
assign *n 'middle'
print *n
return
:main
print 'first'
call :foo
print 'last'
