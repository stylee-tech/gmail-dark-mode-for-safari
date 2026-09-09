#!/usr/bin/env python3
"""Heuristic public-source audit. Reports locations, never matched values."""
import re
import subprocess
import sys


def git(*args):
    return subprocess.check_output(['git', *args])


RULES = {
    'private key': rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',
    'provider token': rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|sk_live_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]{20,})',
    'credential literal': rb'(?i)(?:password|api[_-]?key|client[_-]?secret|access[_-]?token)\s*[=:]\s*[\"\x27][^\"\x27\s]{12,}[\"\x27]',
    'credential URL': rb'https?://[^\s\"<>]*(?:[?&](?:token|password|client_secret)=)',
}
SENSITIVE_PATH = re.compile(r'(^|/)(?:\.env(?:\..*)?|AuthKey_[^/]+|id_rsa|id_ed25519)$|\.(?:p8|p12|pfx|pem|key|mobileprovision|provisionprofile|pkg|ipa)$')
findings = set()
seen = set()
for entry in git('rev-list', '--objects', '--all').decode().splitlines():
    oid, _, path = entry.partition(' ')
    if git('cat-file', '-t', oid).strip() != b'blob':
        continue
    seen.add(oid)
    if SENSITIVE_PATH.search(path) and not path.endswith('.env.example'):
        findings.add(('sensitive historical filename', path))
    body = git('cat-file', 'blob', oid)
    for label, pattern in RULES.items():
        if re.search(pattern, body):
            findings.add((label, path or oid))
# Include current index/worktree contents; untracked assets need explicit review.
for path in git('ls-files', '-z').decode().split('\0'):
    if not path:
        continue
    if SENSITIVE_PATH.search(path) and not path.endswith('.env.example'):
        findings.add(('sensitive tracked filename', path))
    try:
        with open(path, 'rb') as source:
            body = source.read()
    except FileNotFoundError:
        continue
    for label, pattern in RULES.items():
        if re.search(pattern, body):
            findings.add((label, path))
print(f'Scanned {len(seen)} reachable unique file objects plus tracked working files.')
for label, path in sorted(findings):
    print(f'REVIEW: {label}: {path}')
emails = set(git('log', '--all', '--format=%ae%n%ce').decode().splitlines())
print(f'Author/committer email identities: {len(emails)} (values intentionally omitted).')
print('Limits: heuristic patterns only; no OCR, entropy analysis, external artifacts, or credential validity checks.')
print('Inspect images, commit messages, identities, ignored files, and GitHub surfaces separately.')
sys.exit(1 if findings else 0)
