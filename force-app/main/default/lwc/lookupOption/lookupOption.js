/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

export default class LookupOption extends LightningElement {
  @api item;
  @api activeOption;
  @api searchTerm;

  isActive = false;

  get ariaSelectedClass() {
    return this.isActive || this.activeOption === this.item.value
      ? "true"
      : "false";
  }

  get optionClass() {
    return `slds-media slds-media_center slds-listbox__option slds-listbox__option_plain slds-media_small ${
      this.isActive || this.activeOption === this.item.value
        ? "slds-has-focus"
        : ""
    }`;
  }

  handleClick() {
    this.dispatchEvent(
      new CustomEvent("optionselect", { detail: this.item.value })
    );
  }

  handleMouseEnter() {
    this.isActive = true;
    this.dispatchEvent(
      new CustomEvent("optionactivate", { detail: this.item.value })
    );
  }

  handleMouseLeave() {
    this.isActive = false;
  }
}
