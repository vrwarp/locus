import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandManager } from './commands';
import type { Command } from './commands';
import { UpdateStudentCommand } from '../commands/UpdateStudentCommand';
import { updatePerson } from './pco';
import type { Student } from './pco';

vi.mock('./pco', () => ({
    updatePerson: vi.fn(),
    prepareUpdateAttributes: (original: any, updated: any) => {
        // Simple mock implementation for testing
        if (original.pcoGrade !== updated.pcoGrade) return { grade: updated.pcoGrade };
        return {};
    }
}));

// Mock Student
const mockStudent = (id: string, grade: number): Student => ({
    id,
    pcoGrade: grade,
    name: 'Test Student',
    age: 10,
    firstName: 'Test',
    lastName: 'Student',
    birthdate: '2010-01-01',
    calculatedGrade: 5,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    isChild: true,
    householdId: null,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
        hasPhoneAnomaly: false
});

describe('CommandManager', () => {
    let manager: CommandManager;

    beforeEach(() => {
        manager = new CommandManager();
    });

    it('should push command to history on execute', () => {
        const cmd: Command = {
            execute: vi.fn() as any,
            undo: vi.fn() as any,
            description: 'test'
        };
        manager.execute(cmd);
        expect(manager.canUndo).toBe(true);
        expect(manager.canRedo).toBe(false);
    });

    it('should undo command', async () => {
        const cmd: Command = {
            execute: vi.fn() as any,
            undo: vi.fn() as any,
            description: 'test'
        };
        manager.execute(cmd);
        await manager.undo();
        expect(cmd.undo).toHaveBeenCalled();
        expect(manager.canUndo).toBe(false);
        expect(manager.canRedo).toBe(true);
    });

    it('should redo command', async () => {
        const cmd: Command = {
            execute: vi.fn() as any,
            undo: vi.fn() as any,
            description: 'test'
        };
        manager.execute(cmd);
        await manager.undo();
        await manager.redo();
        expect(cmd.execute).toHaveBeenCalled();
        expect(manager.canUndo).toBe(true);
        expect(manager.canRedo).toBe(false);
    });
});

describe('UpdateStudentCommand', () => {
    it('should call updatePerson on execute', async () => {
        const original = mockStudent('1', 5);
        const updated = mockStudent('1', 6);
        const onStateChange = vi.fn();
        const cmd = new UpdateStudentCommand(original, updated, 'auth', false, onStateChange);

        await cmd.execute();
        expect(updatePerson).toHaveBeenCalledWith('1', { grade: 6 }, 'auth', false);
        expect(onStateChange).toHaveBeenCalledWith(updated);
    });

    it('should call updatePerson with original values on undo', async () => {
        const original = mockStudent('1', 5);
        const updated = mockStudent('1', 6);
        const onStateChange = vi.fn();
        const cmd = new UpdateStudentCommand(original, updated, 'auth', false, onStateChange);

        await cmd.undo();
        expect(updatePerson).toHaveBeenCalledWith('1', { grade: 5 }, 'auth', false);
        expect(onStateChange).toHaveBeenCalledWith(original);
    });
});
