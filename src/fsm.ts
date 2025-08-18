import { interpret, StateMachine, Machine } from "xstate";

interface StateValue {
  changed: boolean;
  value: string;
}

interface ControlFsm {
  send: (transition: string) => StateValue;
}

export default abstract class FSM {
  //
  private fsm_;
  private machine_: StateMachine<any, any, any>;
  private name_: string | undefined = undefined;
  private inited: boolean = false;

  constructor(state?: any) {
    if (state) this.machine_ = Machine(state);
  }

  public startFsm() {
    if (this.inited === true) {
      throw new Error("state already initialize");
    }
    this.fsm_ = interpret(this.machine_)
      .onTransition(this.preStateChange.bind(this))
      .start();
    this.inited = true;
  }

  protected fsm(): ControlFsm {
    if (this.inited === false) {
      throw new Error("state not initialize");
    }
    return this.fsm_;
  }

  protected state(): string {
    if (this.inited === false) {
      throw new Error("state not initialize");
    }
    return this.name_;
  }

  protected abstract stateChange(state);

  private preStateChange(state) {
    if (state.changed === false) return;
    else this.name_ = state.value;
    this.stateChange(state);
  }
}
