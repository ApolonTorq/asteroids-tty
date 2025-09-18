export interface InputState {
  thrust: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  shoot: boolean;
  pause: boolean;
  reset: boolean;
  toggleCharacterMode: boolean;
  togglePhysicsMode: boolean;
}

export interface KeyMapping {
  thrust: string[];
  rotateLeft: string[];
  rotateRight: string[];
  shoot: string[];
  pause: string[];
  reset: string[];
  toggleCharacterMode: string[];
  togglePhysicsMode: string[];
}

export type InputAction = keyof InputState;

export interface InputEvent {
  action: InputAction;
  pressed: boolean;
  timestamp: number;
  repeat: boolean;
}

export const DEFAULT_KEY_MAPPING: KeyMapping = {
  thrust: ['KeyW', 'ArrowUp'],
  rotateLeft: ['KeyA', 'ArrowLeft'],
  rotateRight: ['KeyD', 'ArrowRight'],
  shoot: ['Space'],
  pause: ['KeyP', 'Escape'],
  reset: ['KeyR'],
  toggleCharacterMode: ['KeyC'],
  togglePhysicsMode: ['KeyM']
};

export class InputHandler {
  private inputState: InputState;
  private keyMapping: KeyMapping;
  private pressedKeys: Set<string>;
  private eventListeners: ((event: InputEvent) => void)[];
  private element: HTMLElement | null;
  private enabled: boolean;

  constructor(element?: HTMLElement, keyMapping: KeyMapping = DEFAULT_KEY_MAPPING) {
    this.inputState = this.createEmptyInputState();
    this.keyMapping = { ...keyMapping };
    this.pressedKeys = new Set();
    this.eventListeners = [];
    this.element = element || null;
    this.enabled = true;

    this.bindEventListeners();
  }

  private createEmptyInputState(): InputState {
    return {
      thrust: false,
      rotateLeft: false,
      rotateRight: false,
      shoot: false,
      pause: false,
      reset: false,
      toggleCharacterMode: false,
      togglePhysicsMode: false
    };
  }

  private bindEventListeners(): void {
    if (typeof window === 'undefined') return; // SSR safety

    const target = this.element || window;

    target.addEventListener('keydown', this.handleKeyDown.bind(this));
    target.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Prevent default for game keys to avoid page scrolling
    target.addEventListener('keydown', (event) => {
      if (this.isGameKey((event as KeyboardEvent).code)) {
        event.preventDefault();
      }
    });

    // Handle focus/blur to reset input state
    if (this.element) {
      this.element.addEventListener('blur', () => this.resetInputState());
    } else {
      window.addEventListener('blur', () => this.resetInputState());
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled || event.repeat) return;

    const code = event.code;

    if (this.pressedKeys.has(code)) return; // Already pressed

    this.pressedKeys.add(code);

    const action = this.getActionForKey(code);
    if (action) {
      this.setInputState(action, true);
      this.emitInputEvent(action, true, false);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const code = event.code;

    if (!this.pressedKeys.has(code)) return; // Not pressed

    this.pressedKeys.delete(code);

    const action = this.getActionForKey(code);
    if (action) {
      this.setInputState(action, false);
      this.emitInputEvent(action, false, false);
    }
  }

  private getActionForKey(keyCode: string): InputAction | null {
    for (const [action, keys] of Object.entries(this.keyMapping)) {
      if (keys.includes(keyCode)) {
        return action as InputAction;
      }
    }
    return null;
  }

  private isGameKey(keyCode: string): boolean {
    return Object.values(this.keyMapping).some(keys => keys.includes(keyCode));
  }

  private setInputState(action: InputAction, pressed: boolean): void {
    this.inputState[action] = pressed;
  }

  private emitInputEvent(action: InputAction, pressed: boolean, repeat: boolean): void {
    const event: InputEvent = {
      action,
      pressed,
      timestamp: performance.now(),
      repeat
    };

    this.eventListeners.forEach(listener => listener(event));
  }

  private resetInputState(): void {
    this.inputState = this.createEmptyInputState();
    this.pressedKeys.clear();
  }

  // Public API
  getInputState(): Readonly<InputState> {
    return { ...this.inputState };
  }

  isActionPressed(action: InputAction): boolean {
    return this.inputState[action];
  }

  // For single-frame actions (like shoot, pause)
  consumeAction(action: InputAction): boolean {
    if (this.inputState[action]) {
      this.inputState[action] = false;
      return true;
    }
    return false;
  }

  // Event handling
  addEventListener(listener: (event: InputEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: InputEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Configuration
  updateKeyMapping(newMapping: Partial<KeyMapping>): void {
    this.keyMapping = { ...this.keyMapping, ...newMapping };
  }

  getKeyMapping(): KeyMapping {
    return { ...this.keyMapping };
  }

  // Control
  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.resetInputState();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Manual input injection (for testing or AI)
  injectInput(action: InputAction, pressed: boolean): void {
    this.setInputState(action, pressed);
    this.emitInputEvent(action, pressed, false);
  }

  // Simulate key press/release
  simulateKeyPress(keyCode: string): void {
    const action = this.getActionForKey(keyCode);
    if (action) {
      this.injectInput(action, true);
    }
  }

  simulateKeyRelease(keyCode: string): void {
    const action = this.getActionForKey(keyCode);
    if (action) {
      this.injectInput(action, false);
    }
  }

  // Cleanup
  destroy(): void {
    if (typeof window === 'undefined') return;

    const target = this.element || window;

    target.removeEventListener('keydown', this.handleKeyDown.bind(this));
    target.removeEventListener('keyup', this.handleKeyUp.bind(this));

    this.eventListeners = [];
    this.resetInputState();
  }

  // Utility methods for game state
  getMovementInput(): { thrust: boolean; rotateLeft: boolean; rotateRight: boolean } {
    return {
      thrust: this.inputState.thrust,
      rotateLeft: this.inputState.rotateLeft,
      rotateRight: this.inputState.rotateRight
    };
  }

  // Check for actions that should only trigger once per key press
  checkSinglePressActions(): {
    shoot: boolean;
    pause: boolean;
    reset: boolean;
    toggleCharacterMode: boolean;
    togglePhysicsMode: boolean;
  } {
    return {
      shoot: this.consumeAction('shoot'),
      pause: this.consumeAction('pause'),
      reset: this.consumeAction('reset'),
      toggleCharacterMode: this.consumeAction('toggleCharacterMode'),
      togglePhysicsMode: this.consumeAction('togglePhysicsMode')
    };
  }

  // Debug information
  getDebugInfo(): {
    pressedKeys: string[];
    activeActions: InputAction[];
    enabled: boolean;
  } {
    return {
      pressedKeys: Array.from(this.pressedKeys),
      activeActions: Object.entries(this.inputState)
        .filter(([, pressed]) => pressed)
        .map(([action]) => action as InputAction),
      enabled: this.enabled
    };
  }
}