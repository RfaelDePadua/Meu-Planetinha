#!/bin/sh
# Sobe a branch repaginacao no repositório público do projeto (remote origin),
# na própria repaginacao e na main (que o GitHub Pages publica em www.meuplanetinha.com.br),
# sem os documentos internos, que ficam só no repositório privado (remote lucas).
# A cópia filtrada sai sempre igual para os mesmos commits, então o push é um
# avanço normal (nunca push forçado).
set -e
BASE=d6aff45 # último commit em comum com a main do repositório público
git branch -f publico repaginacao
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --index-filter \
  'git rm -r --cached --ignore-unmatch -q docs/RELATORIO_APOIO.md docs/testes' \
  -- "$BASE..publico"
git push origin publico:repaginacao publico:main
