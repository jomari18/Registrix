$ErrorActionPreference='Stop'
$registrixRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$registrixData=[IO.Path]::GetFullPath((Join-Path $registrixRoot '.local-db'))
if(-not $registrixData.StartsWith($registrixRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Unsafe cluster path'}
$registrixBin='C:/Program Files/PostgreSQL/18/bin'
if(-not(Test-Path -LiteralPath (Join-Path $registrixData 'PG_VERSION'))){& (Join-Path $registrixBin 'initdb.exe') -D $registrixData -U registrix_test -A trust -E UTF8; if($LASTEXITCODE -ne 0){throw 'Cannot initialize test database'}}
& (Join-Path $registrixBin 'pg_ctl.exe') -D $registrixData status
if($LASTEXITCODE -ne 0){& (Join-Path $registrixBin 'pg_ctl.exe') -D $registrixData -l (Join-Path $registrixRoot '.local-postgres.log') -o '-p 55444 -h 127.0.0.1' -t 30 start; if($LASTEXITCODE -ne 0){throw 'Cannot start test database'}}
$registrixExists=& (Join-Path $registrixBin 'psql.exe') -h 127.0.0.1 -p 55444 -U registrix_test -d postgres -Atc "select 1 from pg_database where datname='registrix_test'"
if($LASTEXITCODE -ne 0){throw 'Cannot inspect isolated cluster'}
if($registrixExists -ne '1'){& (Join-Path $registrixBin 'createdb.exe') -h 127.0.0.1 -p 55444 -U registrix_test registrix_test; if($LASTEXITCODE -ne 0){throw 'Cannot create database'}}
Write-Output 'Registrix synthetic database ready on 127.0.0.1:55444.'
