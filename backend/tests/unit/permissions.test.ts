import { describe, it, expect } from 'vitest';

describe('Document Permission Matrix Unit Tests', () => {
  const permissionLevels: Record<string, string[]> = {
    VIEW: ['VIEW', 'DOWNLOAD', 'EDIT_METADATA', 'SHARE', 'MANAGE_PERMISSIONS'],
    DOWNLOAD: ['DOWNLOAD', 'EDIT_METADATA', 'SHARE', 'MANAGE_PERMISSIONS'],
    EDIT_METADATA: ['EDIT_METADATA', 'MANAGE_PERMISSIONS'],
    SHARE: ['SHARE', 'MANAGE_PERMISSIONS'],
    MANAGE_PERMISSIONS: ['MANAGE_PERMISSIONS'],
  };

  function canPerform(userPermission: string, requiredAction: string): boolean {
    return Boolean(permissionLevels[requiredAction]?.includes(userPermission));
  }

  it('verifies VIEW permission grants only view action, not download or share', () => {
    expect(canPerform('VIEW', 'VIEW')).toBe(true);
    expect(canPerform('VIEW', 'DOWNLOAD')).toBe(false);
    expect(canPerform('VIEW', 'SHARE')).toBe(false);
    expect(canPerform('VIEW', 'EDIT_METADATA')).toBe(false);
  });

  it('verifies DOWNLOAD permission grants view and download, but not share or edit', () => {
    expect(canPerform('DOWNLOAD', 'VIEW')).toBe(true);
    expect(canPerform('DOWNLOAD', 'DOWNLOAD')).toBe(true);
    expect(canPerform('DOWNLOAD', 'SHARE')).toBe(false);
    expect(canPerform('DOWNLOAD', 'EDIT_METADATA')).toBe(false);
  });

  it('verifies SHARE permission allows view, download, and share', () => {
    expect(canPerform('SHARE', 'VIEW')).toBe(true);
    expect(canPerform('SHARE', 'DOWNLOAD')).toBe(true);
    expect(canPerform('SHARE', 'SHARE')).toBe(true);
    expect(canPerform('SHARE', 'EDIT_METADATA')).toBe(false);
  });

  it('verifies MANAGE_PERMISSIONS grants all capabilities', () => {
    expect(canPerform('MANAGE_PERMISSIONS', 'VIEW')).toBe(true);
    expect(canPerform('MANAGE_PERMISSIONS', 'DOWNLOAD')).toBe(true);
    expect(canPerform('MANAGE_PERMISSIONS', 'SHARE')).toBe(true);
    expect(canPerform('MANAGE_PERMISSIONS', 'EDIT_METADATA')).toBe(true);
    expect(canPerform('MANAGE_PERMISSIONS', 'MANAGE_PERMISSIONS')).toBe(true);
  });
});
