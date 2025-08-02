export interface ClickEvent {
  clientX: number;
  clientY: number;
  button?: number;
  preventDefault?: () => void;
}
