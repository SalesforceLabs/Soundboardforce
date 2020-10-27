/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

import labels from "./labels";

const KEYS = {
  ENTER: 13,
  SPACE: 32
};

export default class FilterList extends LightningElement {
  label = labels;

  static delegatesFocus = true;

  @api filterType;
  @api list;
  @api isEnabled;

  handleFilterChange(event) {
    this.dispatchEvent(
      new CustomEvent("filterchange", {
        detail: { type: this.filterType, value: event.detail.checked }
      })
    );
  }

  handleOptionSelect(event) {
    const user = event.detail;
    this.dispatchEvent(
      new CustomEvent("useradd", {
        detail: {
          dcstuff__User__r: {
            Id: user.value,
            Name: user.label,
            SmallPhotoUrl: user.picture
          }
        }
      })
    );
  }

  handleUserDeleteKeyDown(event) {
    if (event.keyCode === KEYS.ENTER || event.keyCode === KEYS.SPACE) {
      event.preventDefault();
      this.handleUserDelete(event);
    }
  }

  handleUserDelete(event) {
    this.dispatchEvent(
      new CustomEvent("userdelete", { detail: event.target.dataset.value })
    );
  }
}
