export interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  description: string;
}

export class CommandManager {
  public history: Command[] = [];
  public redoStack: Command[] = [];

  execute(command: Command) {
    this.history.push(command);
    this.redoStack = []; // Clear redo stack on new action
  }

  async undo() {
    const command = this.history.pop();
    if (command) {
      await command.undo();
      this.redoStack.push(command);
    }
  }

  async redo() {
    const command = this.redoStack.pop();
    if (command) {
      await command.execute();
      this.history.push(command);
    }
  }

  get canUndo() {
    return this.history.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}
