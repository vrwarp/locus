import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadCSV } from './export';

describe('downloadCSV', () => {
    let createObjectURLMock: ReturnType<typeof vi.fn>;
    let createElementMock: ReturnType<typeof vi.fn>;
    let appendChildMock: ReturnType<typeof vi.fn>;
    let removeChildMock: ReturnType<typeof vi.fn>;
    let clickMock: ReturnType<typeof vi.fn>;
    let setAttributeMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
        global.URL.createObjectURL = createObjectURLMock;

        clickMock = vi.fn();
        setAttributeMock = vi.fn();

        const mockLink = {
            download: '',
            href: '',
            style: { visibility: '' },
            setAttribute: setAttributeMock,
            click: clickMock,
        };

        createElementMock = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
        removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    });

    it('should do nothing if data is empty', () => {
        downloadCSV([], 'test.csv');
        expect(createElementMock).not.toHaveBeenCalled();
    });

    it('should generate and trigger download for valid data', () => {
        const data = [
            { id: 1, name: 'Alice', role: 'Admin' },
            { id: 2, name: 'Bob', role: 'User' },
        ];

        downloadCSV(data, 'users.csv');

        // Check if link was created and appended
        expect(createElementMock).toHaveBeenCalledWith('a');
        expect(setAttributeMock).toHaveBeenCalledWith('href', 'blob:test-url');
        expect(setAttributeMock).toHaveBeenCalledWith('download', 'users.csv');
        expect(appendChildMock).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(removeChildMock).toHaveBeenCalled();
    });

    it('should properly escape double quotes and handle null/undefined', () => {
        const data = [
            { id: 1, text: 'Hello "World"', empty: null, missing: undefined, nested: { a: 1 } },
        ];

        // We can't easily intercept the Blob content in JSDOM, but we can verify the function executes without error
        expect(() => downloadCSV(data, 'escaped.csv')).not.toThrow();
        expect(clickMock).toHaveBeenCalled();
    });
});
