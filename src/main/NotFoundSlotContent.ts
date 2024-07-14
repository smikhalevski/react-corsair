import { ComponentType } from 'react';
import { SlotContent, SlotContentComponents } from './Slot';

export class NotFoundSlotContent implements SlotContent {
  errorComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

  constructor(
    readonly renderedComponent: ComponentType | undefined,
    options: SlotContentComponents
  ) {
    this.errorComponent = options.errorComponent;
    this.notFoundComponent = options.notFoundComponent;
  }
}
