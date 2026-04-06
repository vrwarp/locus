import { getGivingFlowData } from './giving';

describe('giving utils', () => {
    it('generates valid sankey node and link data', () => {
        const data = getGivingFlowData();

        expect(data).toHaveProperty('nodes');
        expect(data).toHaveProperty('links');

        expect(data.nodes.length).toBeGreaterThan(0);
        expect(data.links.length).toBeGreaterThan(0);

        // Ensure every link references a valid node index
        const nodeCount = data.nodes.length;
        data.links.forEach(link => {
            expect(link.source).toBeGreaterThanOrEqual(0);
            expect(link.source).toBeLessThan(nodeCount);

            expect(link.target).toBeGreaterThanOrEqual(0);
            expect(link.target).toBeLessThan(nodeCount);

            expect(link.value).toBeGreaterThan(0);
        });
    });
});
