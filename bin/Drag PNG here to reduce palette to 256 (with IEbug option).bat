@echo off

set path=%~d0%~p0

:start

"%path%pngquant.exe" --iebug --force --verbose 256 %1
"%path%pngquant.exe" --iebug --force --verbose --speed=1 --ordered 256 %1

shift
if NOT x%1==x goto start
