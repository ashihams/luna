"""Run requested suites while protecting the production data directory.

npm test prepares data before running tests, so run the unmodified command in
an isolated copy under data/out_accuracy. No install, deploy or network call.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
from research.accuracy.run_criterion_diagnostic import ROOT, OUT, production_snapshot


def main():
    before = production_snapshot()
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
    isolated = OUT / 'npm-test-workspace'
    isolated.mkdir(parents=True, exist_ok=True)
    for name in ['scripts', 'tests', 'web/src', 'web/public/data', 'web/node_modules']:
        shutil.copytree(ROOT / name, isolated / name, dirs_exist_ok=True)
    for name in ['package.json', 'web/package.json']:
        shutil.copy2(ROOT / name, isolated / name)
    commands = [
        ('pytest', [str(ROOT / '.venv/Scripts/python.exe'), '-m', 'pytest',
                    'pipeline/validate', '-vv', '-p', 'no:cacheprovider',
                    '--basetemp=data/out_accuracy/pytest-full'], ROOT),
        ('npm', ['npm.cmd', 'test'], isolated),
    ]
    records = []
    for name, command, cwd in commands:
        result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True)
        log = OUT / f'{name}.log'
        log.write_text(result.stdout + result.stderr, encoding='utf-8')
        print(result.stdout + result.stderr, flush=True)
        records.append(dict(suite=name, command=command, cwd=str(cwd),
                            exit_code=result.returncode, log=log.relative_to(ROOT).as_posix()))
    after = production_snapshot()
    baseline = json.loads((OUT / 'production-before.json').read_text())
    record = dict(suites=records, original_production_data_unchanged=before == after == baseline,
                  production_file_count=len(after), production_sha256=after)
    (ROOT / 'research/accuracy/test_results.json').write_text(json.dumps(record, indent=2) + '\n')
    assert record['original_production_data_unchanged']
    assert all(r['exit_code'] == 0 for r in records)


if __name__ == '__main__':
    main()
