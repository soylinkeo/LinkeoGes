import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPreviewEnvironment, assertMutationAllowed } from '../src/services/environmentGuard.js';

test('isPreviewEnvironment accurately identifies Vercel branch previews', () => {
  const branchPreview = 'linkeo-ges-git-feature-fase-02-sprint-02-mobile-ux-soylinkeos-projects.vercel.app';
  assert.equal(isPreviewEnvironment(branchPreview), true);

  const hashPreview = 'linkeo-ges-8d29fa1-soylinkeos-projects.vercel.app';
  assert.equal(isPreviewEnvironment(hashPreview), true);
});

test('isPreviewEnvironment does not flag production or localhost as preview', () => {
  assert.equal(isPreviewEnvironment('linkeo-ges.vercel.app'), false);
  assert.equal(isPreviewEnvironment('localhost'), false);
  assert.equal(isPreviewEnvironment('127.0.0.1'), false);
  assert.equal(isPreviewEnvironment(''), false);
});

test('isPreviewEnvironment respects global environment preview flags', () => {
  try {
    globalThis.__VERCEL_ENV__ = 'preview';
    assert.equal(isPreviewEnvironment('localhost'), true);
  } finally {
    delete globalThis.__VERCEL_ENV__;
  }
});

test('assertMutationAllowed throws security exception in preview environment', () => {
  try {
    globalThis.__VERCEL_ENV__ = 'preview';
    assert.throws(
      () => assertMutationAllowed('El guardado de cambios'),
      (err) => {
        assert.match(err.message, /\[BLOQUEO DE SEGURIDAD PREVIEW\]/);
        assert.match(err.message, /La base de datos central de LINKEO está protegida técnicamente contra escrituras/);
        return true;
      }
    );
  } finally {
    delete globalThis.__VERCEL_ENV__;
  }
});

test('assertMutationAllowed succeeds without throwing in normal environment', () => {
  // En entorno normal no debe lanzar excepción
  assert.doesNotThrow(() => {
    assertMutationAllowed('Operación normal');
  });
});
