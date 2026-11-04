#!/bin/sh
# Sobe a branch repaginacao no repositório público do projeto (remote origin),
# sem os documentos internos, que ficam só no repositório privado (remote lucas).
# A cópia filtrada sai sempre igual para os mesmos commits, então o push é um
# avanço normal. Nunca mexe na main, que publica www.meuplanetinha.com.br.
set -e
BASE=d6aff45 # último commit em comum com a main do repositório público
git branch -f publico repaginacao
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --index-filter \
  'git rm -r --cached --ignore-unmatch -q docs/RELATORIO_APOIO.md docs/testes' \
  -- "$BASE..publico"
git push origin publico:repaginacao
