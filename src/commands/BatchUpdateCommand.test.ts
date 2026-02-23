import { BatchUpdateCommand } from './BatchUpdateCommand';
import { updatePerson, prepareUpdateAttributes } from '../utils/pco';
import type { Student } from '../utils/pco';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock utils
vi.mock('../utils/pco', () => ({
    updatePerson: vi.fn(),
    prepareUpdateAttributes: vi.fn()
}));

describe('BatchUpdateCommand', () => {
    let mockChild: Student;
    let mockParent: Student;
    let onStateChange: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockChild = {
            id: '1',
            isChild: true,
            firstName: 'Child',
            lastName: 'One',
        } as Student;

        mockParent = {
            id: '2',
            isChild: false,
            firstName: 'Parent',
            lastName: 'One',
        } as Student;

        onStateChange = vi.fn();
    });

    it('should swap isChild status', async () => {
        const updates = [
            { original: mockChild, updated: { ...mockChild, isChild: false } },
            { original: mockParent, updated: { ...mockParent, isChild: true } }
        ];

        // Mock prepareUpdateAttributes to return empty initially,
        // as we are manually handling isChild in the command
        (prepareUpdateAttributes as any).mockImplementation(() => ({}));

        const command = new BatchUpdateCommand(updates, 'auth-token', false, onStateChange);

        await command.execute();

        expect(updatePerson).toHaveBeenCalledTimes(2);

        // Child update call
        expect(updatePerson).toHaveBeenCalledWith(
            '1',
            expect.objectContaining({ child: false }),
            'auth-token',
            false
        );

        // Parent update call
        expect(updatePerson).toHaveBeenCalledWith(
            '2',
            expect.objectContaining({ child: true }),
            'auth-token',
            false
        );

        expect(onStateChange).toHaveBeenCalledTimes(2);
    });

    it('should undo swap', async () => {
        const updates = [
            { original: mockChild, updated: { ...mockChild, isChild: false } },
            { original: mockParent, updated: { ...mockParent, isChild: true } }
        ];

        (prepareUpdateAttributes as any).mockImplementation(() => ({}));
        const command = new BatchUpdateCommand(updates, 'auth-token', false, onStateChange);

        await command.undo();

        expect(updatePerson).toHaveBeenCalledTimes(2);

        // Child revert call (back to true)
        expect(updatePerson).toHaveBeenCalledWith(
            '1',
            expect.objectContaining({ child: true }),
            'auth-token',
            false
        );

        // Parent revert call (back to false)
        expect(updatePerson).toHaveBeenCalledWith(
            '2',
            expect.objectContaining({ child: false }),
            'auth-token',
            false
        );
    });
});
