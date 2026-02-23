import { updatePerson, prepareUpdateAttributes } from '../utils/pco';
import type { Student } from '../utils/pco';
import type { Command } from '../utils/commands';

export class BatchUpdateCommand implements Command {
    private updates: { original: Student, updated: Student }[];
    private auth: string;
    private sandboxMode: boolean;
    private onStateChange: (student: Student) => void;

    constructor(
        updates: { original: Student, updated: Student }[],
        auth: string,
        sandboxMode: boolean,
        onStateChange: (student: Student) => void
    ) {
        this.updates = updates;
        this.auth = auth;
        this.sandboxMode = sandboxMode;
        this.onStateChange = onStateChange;
    }

    async execute(): Promise<void> {
        for (const update of this.updates) {
             const attributes = prepareUpdateAttributes(update.original, update.updated);
             // Special handling for isChild because it's not in prepareUpdateAttributes by default
             if (update.original.isChild !== update.updated.isChild) {
                 attributes.child = update.updated.isChild;
             }

             if (Object.keys(attributes).length > 0) {
                 await updatePerson(update.original.id, attributes, this.auth, this.sandboxMode);
                 this.onStateChange(update.updated);
             }
        }
    }

    async undo(): Promise<void> {
        // Reverse updates
        for (const update of this.updates) {
             const attributes = prepareUpdateAttributes(update.updated, update.original);
             if (update.original.isChild !== update.updated.isChild) {
                 attributes.child = update.original.isChild;
             }

             if (Object.keys(attributes).length > 0) {
                 await updatePerson(update.original.id, attributes, this.auth, this.sandboxMode);
                 this.onStateChange(update.original);
             }
        }
    }

    async redo(): Promise<void> {
        await this.execute();
    }
}
