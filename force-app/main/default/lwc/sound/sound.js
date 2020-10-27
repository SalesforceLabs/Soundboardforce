/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

export default class Sound extends LightningElement {
  static delegatesFocus = true;

  @api sound;

  handleFocus() {
    this.template.querySelector("img").classList.add("zoom");
  }

  handleBlur() {
    this.template.querySelector("img").classList.remove("zoom");
  }

  handleClick() {
    this.dispatchEvent(new CustomEvent("soundclicked", { detail: this.sound }));
  }
}
